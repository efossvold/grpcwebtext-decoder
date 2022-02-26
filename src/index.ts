#!/usr/bin/env node
import { exec } from 'child_process'
import { promisify } from 'util'
import minimist from 'minimist'
import chalk from 'chalk'
import which from 'which'

const argv = minimist(process.argv.slice(2))
const asyncExec = promisify(exec)
const { log } = console

const grpcWebTexts: Array<string> = [
  'AAAAADEKB2pvZmxveWQSJmh0dHBzOi8vcGljc3VtLnBob3Rvcy9pZC8xMzMvMjc0Mi8xODI4',
  'AAAAAAMInRQ=gAAAACBncnBjLXN0YXR1czowDQpncnBjLW1lc3NhZ2U6T0sNCg==',
]

const getBinaryHex = (grpcTexts: Array<string>) => {
  const buffers: Array<string> = []

  grpcTexts.forEach(text => {
    const buffer = Buffer.from(text.trim(), 'base64')
    const bufString = buffer.toString('hex')
    buffers.push(bufString)
  })

  return buffers
}

const validateProtocExist = () => {
  const resolved = which.sync('protoc', { nothrow: false })
  if (!resolved) {
    log(
      chalk.red(
        `\ngrpcwebtext-parser requires ${chalk.bgRed(
          chalk.white(`protoc`),
        )}\nPlease download it before running this program\n`,
      ),
    )
    process.exit(1)
  }
}

function main() {
  validateProtocExist()

  const { _: text } = argv

  if (text.length === 0) {
    console.error('No input grpc text, defaulting to demo values')
  }

  // bytes are in base 16
  const buffers = text.length ? getBinaryHex(text) : getBinaryHex(grpcWebTexts)

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  buffers.forEach(async (buffer, i) => {
    const responseStartMarkerLen = 2

    if (buffer.substr(0, responseStartMarkerLen) !== '00')
      return log(chalk.bgRed('Cannot Parse'))
    const frameLen = buffer.substr(2, 4 * 2)

    const frameLenInt = parseInt(frameLen, 16) * 2
    const frameDataIndex = responseStartMarkerLen + frameLen.length
    const frameData = buffer.substr(frameDataIndex, frameLenInt)
    const frameParsed = await asyncExec(
      `echo ${frameData} | xxd -r -p | protoc --decode_raw`,
    )
    log(`\n${chalk.bgBlue('Web gRPC text:')} ${text[i] || grpcWebTexts[i]}\n`)
    log(frameParsed.stdout)

    const trailersLen = 2
    const trailersLenIndex = frameDataIndex + frameLenInt
    const hasTrailers = buffer.substr(trailersLenIndex, trailersLen) === '80'

    if (hasTrailers) {
      const headerLenIndex = trailersLenIndex + trailersLen
      const headerLen = buffer.substr(headerLenIndex, 4 * 2)
      const headerLenInt = parseInt(headerLen, 16) * 2
      const headerIndex = headerLenIndex + headerLen.length
      const headerData = buffer.substr(headerIndex, headerLenInt)

      log('Trailing headers:')

      // '0d0a' is hex value of the '\r\n' ASCII characters
      headerData.split('0d0a').forEach(header => {
        log(Buffer.from(header, 'hex').toString('ascii').replace(':', ': '))
      })
    }
  })
}

main()
