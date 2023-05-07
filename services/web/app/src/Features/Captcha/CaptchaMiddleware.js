const fetch = require('node-fetch')
const logger = require('@overleaf/logger')
const Settings = require('@overleaf/settings')
const Metrics = require('@overleaf/metrics')
const OError = require('@overleaf/o-error')
const DeviceHistory = require('./DeviceHistory')
const AuthenticationController = require('../Authentication/AuthenticationController')
const { expressify } = require('../../util/promises')

function respondInvalidCaptcha(req, res) {
  res.status(400).json({
    errorReason: 'cannot_verify_user_not_robot',
    message: {
      text: req.i18n.translate('cannot_verify_user_not_robot'),
    },
  })
}

async function initializeDeviceHistory(req) {
  req.deviceHistory = new DeviceHistory()
  try {
    await req.deviceHistory.parse(req)
  } catch (err) {
    logger.err({ err }, 'cannot parse deviceHistory')
  }
}

async function canSkipCaptcha(req, res) {
  await initializeDeviceHistory(req)
  const canSkip = req.deviceHistory.has(req.body?.email)
  Metrics.inc('captcha_pre_flight', 1, {
    status: canSkip ? 'skipped' : 'missing',
  })
  res.json(canSkip)
}

function validateCaptcha(action) {
  return expressify(async function (req, res, next) {
    if (!Settings.recaptcha?.siteKey || Settings.recaptcha.disabled[action]) {
      if (action === 'login') {
        AuthenticationController.setAuditInfo(req, { captcha: 'disabled' })
      }
      Metrics.inc('captcha', 1, { path: action, status: 'disabled' })
      return next()
    }
    const reCaptchaResponse = req.body['g-recaptcha-response']
    if (action === 'login') {
      await initializeDeviceHistory(req)
      if (!reCaptchaResponse && req.deviceHistory.has(req.body?.email)) {
        // The user has previously logged in from this device, which required
        //  solving a captcha or keeping the device history alive.
        // We can skip checking the (missing) captcha response.
        AuthenticationController.setAuditInfo(req, { captcha: 'skipped' })
        Metrics.inc('captcha', 1, { path: action, status: 'skipped' })
        return next()
      }
    }
    if (!reCaptchaResponse) {
      Metrics.inc('captcha', 1, { path: action, status: 'missing' })
      return respondInvalidCaptcha(req, res)
    }

    const response = await fetch(Settings.recaptcha.endpoint, {
      method: 'POST',
      body: new URLSearchParams([
        ['secret', Settings.recaptcha.secretKey],
        ['response', reCaptchaResponse],
      ]),
      headers: {
        Accept: 'application/json',
      },
    })
    const body = await response.json()
    if (!response.ok) {
      Metrics.inc('captcha', 1, { path: action, status: 'error' })
      throw new OError('failed recaptcha siteverify request', {
        statusCode: response.status,
        body,
      })
    }
    if (!body.success) {
      logger.warn(
        { statusCode: 200, body },
        'failed recaptcha siteverify request'
      )
      Metrics.inc('captcha', 1, { path: action, status: 'failed' })
      return respondInvalidCaptcha(req, res)
    }
    Metrics.inc('captcha', 1, { path: action, status: 'solved' })
    if (action === 'login') {
      AuthenticationController.setAuditInfo(req, { captcha: 'solved' })
    }
    next()
  })
}

module.exports = {
  respondInvalidCaptcha,
  validateCaptcha,
  canSkipCaptcha: expressify(canSkipCaptcha),
}
