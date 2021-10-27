//"use strict";

import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = Application.start()

Stimulus.register("arm-updater", class extends Controller {
  static targets = []
  
  connect() {
    console.log("Connected an arm updater")
    this.update()
  }
  
  update() {
    console.log("Updating arms!")
    const button_cont = document.getElementById(this.element.dataset.radiocontainer)
    button_cont.innerHTML = ''
    const arm_values = this.element.value.trim().split("\n").filter(a => a.length > 0)
    const url = new URL(window.location)
    const a_str = url.searchParams.get(this.element.dataset.param) || ''

    console.log(arm_values)
    for (const [i, arm] of arm_values.entries()) {
      console.log(i)
      console.log(arm)
      let radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = 'asel'
      radio.id = `arm_${i}`
      radio.dataset.controller = 'urlsync tablizer'
      radio.dataset.action = 'urlsync#update tablizer#build_table'
      radio.dataset.tableid = 'mapping_table'
      radio.value = arm
      let label = document.createElement('label')
      label.setAttribute('for', radio.id)
      label.innerText = arm
      button_cont.appendChild(radio)
      button_cont.appendChild(label)
    }
  }
})

Stimulus.register("urlsync", class extends Controller {
  /* 
  A controller to sync an input-style element with a URL parameter.
  URL parameter is set by the name of the input.
  Currently works with textarea and radio inputs.
  */
  
  
  static targets = []
  
  connect() {
    const connect_fx = this.connect_for_element()
    connect_fx(this.element)
  }
  
  update() {
    const update_fx = this.update_for_element()
    update_fx(this.element)
  }
  
  connect_for_element() {
    const map = {
      'textarea': this.connect_textarea,
      'radio': this.connect_radio
    }
    const fx = map[this.input_type()] || this.noop()
    return fx
  }
  
  update_for_element() {
    const map = {
      'textarea': this.update_textarea,
      'radio': this.update_radio
    }
    const fx = map[this.input_type()] || this.noop()
    return fx
  }
  
  connect_textarea(element) {
    const url = new URL(window.location)
    const val_str = url.searchParams.get(element.name) || ''
    const values = val_str.split(",")
    element.value = values.join("\n")
  }
  
  connect_radio(element) {
    const url = new URL(window.location)
    const val_str = url.searchParams.get(element.name) || ''
    if (element.value == val_str) {
      element.checked = true
    } else {
      element.checked = false
    }
  }
  
  update_textarea(element) {    
    const url = new URL(window.location);
    const val_str = element.value.trim().split("\n").join(",")
    console.log(`setting ${element.name} to ${val_str}`)
    url.searchParams.set(element.name, val_str)
    history.replaceState({}, '', url)
  }
  
  update_radio(element) {
    const url = new URL(window.location);
    const parent = element.parentElement
    const sel = parent.querySelector("input[type=radio]:checked")
    let value = ""
    if (sel) {
      value = sel.value
    }
    console.log(`setting ${element.name} to ${value}`)
    url.searchParams.set(element.name, value)
    history.replaceState({}, '', url)
  }
  
  noop() {}
  
  input_type() {
    let nodeName = this.element.nodeName.toLowerCase()
    if (nodeName == 'input') {
      return this.element.type
    }
    return nodeName
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
    const events = url.searchParams.get('es').split(',')
    const instruments = url.searchParams.get('is').split(',')
    table.appendChild(this.make_event_header(events))
    let flat_idx = 0;
    for(let ins_idx = 0; ins_idx < instruments.length; ins_idx++) {
      let row = document.createElement('tr')
      let cell = document.createElement('th')
      cell.innerText = instruments[ins_idx]
      row.appendChild(cell)
      for (let evt_idx = 0; evt_idx < events.length; evt_idx++) {
        cell = document.createElement('td')
        let checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.dataset.index = flat_idx
        checkbox.dataset.event = evt_idx
        checkbox.dataset.instrument = ins_idx
        checkbox.dataset.controller = 'checker'
        checkbox.dataset.action = 'click->checker#toggle'
        cell.appendChild(checkbox)
        row.appendChild(cell)
        flat_idx++
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

Stimulus.register("checker", class extends Controller {
  connect() {
    console.log("It's-a-me!")
    // const url = new URL(window.location)
    // const my_arm = url.searchParams.get('asel')
    // this.param = `arm[${my_arm}]`
    // const val_str = url.searchParams.get(this.param) || '[]'
    // const checked_ar = JSON.parse(val_str)
    // console.log(checked_ar)
    // const my_idx = JSON.parse(this.element.dataset.indexes)
    // this.element.checked = false
    // for (const pair of checked_ar) {
    //   console.log(`mine: ${my_idx}, pair: ${pair}, equal: ${my_idx === pair}`)
    //   if (my_idx == pair) {
    //     this.element.checked = true
    //   }
    // }
  }
  
  toggle() {
    console.log('toggling')
    this.store_checked_values()
  }
  
  store_checked_values() {
    const url = new URL(window.location)

    const table = this.element.closest('table')
    const checked = table.querySelectorAll('input[type=checkbox]:checked')
    let checked_ar = []
    for (const elt of checked) {
      console.log(elt)
      checked_ar.push(JSON.parse(elt.dataset.indexes))
    }
    url.searchParams.set(this.param, JSON.stringify(checked_ar))
    history.replaceState({}, '', url)
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