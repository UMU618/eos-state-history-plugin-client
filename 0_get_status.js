#!/usr/bin/env node

/**
 * @author UMU618 <umu618@hotmail.com>
 * @copyright MEET.ONE 2018
 * @description Use block-always-using-brace npm-coding-style.
 * #editor.tabSize: 2
 * yarn add commander
 * yarn add ws
 * yarn add eosjs@beta
 */

'use strict'

let socketAddress

{
  const DEFAULT_ADDRESS = 'ws://localhost:8080'

  const po = require('commander')
  po
    .version('0.1.0')
    .option('-a, --socket-address [address]', 'Socket address', DEFAULT_ADDRESS)
    .parse(process.argv)

  if (!po.socketAddress) {
    po.outputHelp()
    process.exit(-1)
  }

  console.log('Socket address: ' + po.socketAddress)
  socketAddress = po.socketAddress
}

const WebSocket = require('ws')
const { Serialize } = require('eosjs')
const { TextDecoder, TextEncoder } = require('text-encoding')

let expectingABI = true
let serverTypes
const ws = new WebSocket(socketAddress, {perMessageDeflate: false})

ws.on('open', function open() {
  expectingABI = true
})

ws.on('message', async function message(data) {
  if (expectingABI) {
    expectingABI = false

    let serverABI = JSON.parse(data)
    //console.log(serverABI)
    serverTypes = Serialize.getTypesFromAbi(Serialize.createInitialTypes()
      , serverABI)
    //console.log('request:', serverTypes.get('request'))

    setInterval(() => {
      const buffer = new Serialize.SerialBuffer({
        textEncoder: new TextEncoder(),
        textDecoder: new TextDecoder(),
      })
      //console.log(buffer)
      serverTypes.get('request').serialize(buffer, ['get_status_request_v0', {}]
        )
      ws.send(buffer.asUint8Array())
    }, 500);
  } else {
    const buffer = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      array: data
    })
    const realData = serverTypes.get('result').deserialize(buffer)
    console.log(realData)
  }
})
