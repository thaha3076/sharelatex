// To add a new version, copy and adjust one of the `importPDFJS*` functions below,
// add the variant to the "switch" statement, and add to `pdfjsVersions` in webpack.config.js

import 'core-js/stable/global-this' // polyfill for globalThis (used by pdf.js)
import 'core-js/stable/promise/all-settled' // polyfill for Promise.allSettled (used by pdf.js)
import getMeta from '../../../utils/meta'
import { createWorker } from '../../../utils/worker'

async function importPDFJS31() {
  const cMapUrl = '/js/pdfjs-dist31/cmaps/'
  const standardFontDataUrl = '/fonts/pdfjs-dist31/'
  const imageResourcesPath = '/images/pdfjs-dist31/'

  const [PDFJS, PDFJSViewer] = await Promise.all([
    import('pdfjs-dist31/legacy/build/pdf'),
    import('pdfjs-dist31/legacy/web/pdf_viewer'),
    import('pdfjs-dist31/legacy/web/pdf_viewer.css'),
  ])

  createWorker(() => {
    PDFJS.GlobalWorkerOptions.workerPort = new Worker(
      new URL('pdfjs-dist31/legacy/build/pdf.worker.js', import.meta.url)
    )
  })

  return {
    PDFJS,
    PDFJSViewer,
    cMapUrl,
    imageResourcesPath,
    standardFontDataUrl,
  }
}

async function importPDFJS213() {
  const cMapUrl = '/js/pdfjs-dist213/cmaps/'
  const standardFontDataUrl = '/fonts/pdfjs-dist213/'
  const imageResourcesPath = '/images/pdfjs-dist213/'

  const [PDFJS, PDFJSViewer] = await Promise.all([
    import('pdfjs-dist213/legacy/build/pdf'),
    import('pdfjs-dist213/legacy/web/pdf_viewer'),
    import('pdfjs-dist213/legacy/web/pdf_viewer.css'),
  ])

  createWorker(() => {
    PDFJS.GlobalWorkerOptions.workerPort = new Worker(
      new URL('pdfjs-dist213/legacy/build/pdf.worker.js', import.meta.url)
    )
  })

  return {
    PDFJS,
    PDFJSViewer,
    cMapUrl,
    imageResourcesPath,
    standardFontDataUrl,
  }
}

async function importPDFJS() {
  const variant = getMeta('ol-pdfjsVariant', 'default')

  switch (variant) {
    case '213':
    case 'default':
      return importPDFJS213()

    case '318':
      return importPDFJS31()
  }
}

export default importPDFJS()
