import _ from 'lodash'
import { getUpdateForVersion } from './history-details'
import type { Nullable } from '../../../../../types/utils'
import type { FileDiff } from '../services/types/file'
import type { FileOperation } from '../services/types/file-operation'
import type { LoadedUpdate, Version } from '../services/types/update'

type FileWithOps = {
  pathname: FileDiff['pathname']
  operation: FileOperation
}

function getFilesWithOps(
  files: FileDiff[],
  toV: Version,
  comparing: boolean,
  updates: LoadedUpdate[]
): FileWithOps[] {
  if (toV && !comparing) {
    const filesWithOps: FileWithOps[] = []
    const currentUpdate = getUpdateForVersion(toV, updates)

    if (currentUpdate) {
      for (const pathname of currentUpdate.pathnames) {
        filesWithOps.push({
          pathname,
          operation: 'edited',
        })
      }

      for (const op of currentUpdate.project_ops) {
        let fileWithOps: Nullable<FileWithOps> = null

        if (op.add) {
          fileWithOps = {
            pathname: op.add.pathname,
            operation: 'added',
          }
        } else if (op.remove) {
          fileWithOps = {
            pathname: op.remove.pathname,
            operation: 'removed',
          }
        } else if (op.rename) {
          fileWithOps = {
            pathname: op.rename.newPathname,
            operation: 'renamed',
          }
        }

        if (fileWithOps !== null) {
          filesWithOps.push(fileWithOps)
        }
      }
    }

    return filesWithOps
  } else {
    const filesWithOps = _.reduce(
      files,
      (curFilesWithOps, file) => {
        if ('operation' in file) {
          curFilesWithOps.push({
            pathname: file.pathname,
            operation: file.operation,
          })
        }
        return curFilesWithOps
      },
      <FileWithOps[]>[]
    )

    return filesWithOps
  }
}

const orderedOpTypes: FileOperation[] = [
  'edited',
  'added',
  'renamed',
  'removed',
]

export function autoSelectFile(
  files: FileDiff[],
  toV: Version,
  comparing: boolean,
  updates: LoadedUpdate[]
): FileDiff {
  let fileToSelect: Nullable<FileDiff> = null

  const filesWithOps = getFilesWithOps(files, toV, comparing, updates)
  for (const opType of orderedOpTypes) {
    const fileWithMatchingOpType = _.find(filesWithOps, {
      operation: opType,
    })

    if (fileWithMatchingOpType != null) {
      fileToSelect =
        _.find(files, {
          pathname: fileWithMatchingOpType.pathname,
        }) ?? null

      break
    }
  }

  if (!fileToSelect) {
    const mainFile = _.find(files, function (file) {
      return /main\.tex$/.test(file.pathname)
    })

    if (mainFile) {
      fileToSelect = mainFile
    } else {
      const anyTeXFile = _.find(files, function (file) {
        return /\.tex$/.test(file.pathname)
      })

      if (anyTeXFile) {
        fileToSelect = anyTeXFile
      } else {
        fileToSelect = files[0]
      }
    }
  }

  return fileToSelect
}
