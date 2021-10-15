//"use strict";

import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = Application.start()

Stimulus.register("hello", class extends Controller {
  static targets = [ "name" ]

  connect() {
    console.log("I connected yo");
  }
})

Stimulus.register("arm-updater", class extends Controller {
  static targets = []
  
  connect() {
    console.log("Connected an arm updater")
    this.update()
  }
  
  update() {
    console.log("Updating arms!")
    const button_cont = document.getElementById(this.element.dataset.radiocontainer)
    const arm_values = this.element.value.trim().split("\n").filter(a => a.length > 0)
    console.log(arm_values)
    const arm_labels = arm_values.map((arm, i) => {
      return `<input type="radio" value="${arm}" name="armradio" id="arm_${i}"> <label for="arm_${i}">${arm}</label>`
    })
    
    button_cont.innerHTML = arm_labels.join(' ')
  }
})

Stimulus.register("listbox", class extends Controller {
  
  static targets = []
  
  connect() {
    console.log(`Reading from ${this.element.dataset.param}`)
    const url = new URL(window.location)
    const val_str = url.searchParams.get(this.element.dataset.param) || ''
    const values = val_str.split(",")
    this.element.value = values.join("\n")
  }
  
  update() {
    const url = new URL(window.location);
    const val_str = this.element.value.split("\n").join(",")
    console.log(`setting ${this.element.dataset.param} to ${val_str}`)
    url.searchParams.set(this.element.dataset.param, val_str)
    history.replaceState({}, '', url)
  }
})

Stimulus.register("tablizer", class extends Controller {
  connect() {
    console.log("tablizer is here")
    this.build_table()
  }
  
  build_table() {
    console.log("BUILDING A TABLE")
    const table = document.getElementById(this.element.dataset.tableid)
    table.innerHTML = ''
    const url = new URL(window.location);
    const events = url.searchParams.get('events').split(',')
    const instruments = url.searchParams.get('instruments').split(',')
    table.appendChild(this.make_event_header(events))
    
    for(ins_idx = 0; ins_idx < instruments.length; ins_idx++) {
      let row = document.createElement('tr')
      let cell = document.createElement('th')
      cell.innerText = instruments[ins_idx]
      row.appendChild(cell)
      for (evt_idx = 0; evt_idx < instruments.length; evt_idx++) {
        cell = document.createElement('td')
        let checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.dataset.event = evt_idx
        checkbox.dataset.instrument = ins_idx
        cell.appendChild(c)
      }
      table.appendChild(row)
    }
  }
  
  make_event_header(events) {
    let row = document.createElement('tr')
    row.appendChild(document.createElement('th'))
    for(let ei = 0; ei < events.length; ei++) {
      let cell = document.createElement('th')
      cell.innerText = events[ei]
      row.appendChild(cell)
    }
    return row
  }
})


// Stuff to turn arrays into reasonable-ish-length strings
// maybe overkill

/*\
|*|
|*|  Base64 / binary data / UTF-8 strings utilities
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
|*|
\*/

/* Array of bytes to Base64 string decoding */

function b64ToUint6 (nChr) {

  return nChr > 64 && nChr < 91 ?
      nChr - 65
    : nChr > 96 && nChr < 123 ?
      nChr - 71
    : nChr > 47 && nChr < 58 ?
      nChr + 4
    : nChr === 43 ?
      62
    : nChr === 47 ?
      63
    :
      0;

}

function base64DecToArr (sBase64, nBlocksSize) {

  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;

    }
  }

  return taBytes;
}

/* Base64 string to array encoding */

function uint6ToB64 (nUint6) {

  return nUint6 < 26 ?
      nUint6 + 65
    : nUint6 < 52 ?
      nUint6 + 71
    : nUint6 < 62 ?
      nUint6 - 4
    : nUint6 === 62 ?
      43
    : nUint6 === 63 ?
      47
    :
      65;

}

function base64EncArr (aBytes) {

  var nMod3 = 2, sB64Enc = "";

  for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3;
    if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
    nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
    if (nMod3 === 2 || aBytes.length - nIdx === 1) {
      sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
      nUint24 = 0;
    }
  }

  return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');

}

console.log(window.Stimulus);