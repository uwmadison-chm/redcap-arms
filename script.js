//"use strict";

import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = Application.start()

Stimulus.register("arm-updater", class extends Controller {  
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
    // So we can make sure one arm button is always selected 
    let asel = url.searchParams.get('asel')
    if (arm_values.indexOf(asel) < 0) { asel = '' }

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
      console.log(`asel is ${asel}`)
      let label = document.createElement('label')
      label.setAttribute('for', radio.id)
      label.innerText = arm
      button_cont.appendChild(radio)
      if (asel === '') {
        // actually make sure one arm button is selected
        asel = arm
        radio.checked = true
        url.searchParams.set('asel', arm)
        history.replaceState({}, '', url)
      }
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
  
  static values = { paramName: String}
  
  connect() {
    if (!this.hasParamNameValue) {
      this.paramNameValue = this.element.name
    }
    console.log(`param name is ${this.paramNameValue}`)
    const connect_fx = this.connect_for_element()
    connect_fx()
  }
  
  update() {
    const update_fx = this.update_for_element()
    update_fx()
  }
  
  connect_for_element() {
    const map = {
      'textarea': this.connect_textarea,
      'radio': this.connect_radio,
      'generic': this.connect_contentEditable
    }
    const input_type = this.input_type()
    console.log(`Input type detected: ${input_type}`)
    const fx = map[input_type] || this.noop()
    return fx.bind(this)
  }
  
  update_for_element() {
    const map = {
      'textarea': this.update_textarea,
      'radio': this.update_radio,
      'generic': this.update_contentEditable
    }
    const fx = map[this.input_type()] || this.noop()
    return fx.bind(this)
  }
  
  connect_textarea() {
    console.log(`this is ${this}`)
    const val_str = this.get_param_value()
    const values = val_str.split(",")
    this.element.value = values.join("\n")
  }
  
  connect_radio() {
    const val_str = this.get_param_value()
    if (val_str === '') { return }
    if (this.element.value == val_str) {
      this.element.checked = true
    } else {
      this.element.checked = false
    }
  }
  
  connect_contentEditable(element) {
    const val = this.get_param_value()
    if (val === '') { return }
    this.element.innerText = val
  }
  
  update_textarea(element) {    
    const val_str = this.element.value.trim().split("\n").join(",")
    this.set_param_value(val_str)
  }
  
  update_radio(element) {
    const parent = this.element.parentElement
    const sel = parent.querySelector("input[type=radio]:checked")
    let value = ""
    if (sel) {
      value = sel.value
    }
    this.set_param_value(value)
  }
  
  update_contentEditable(element) {
    this.set_param_value(this.element.innerText)
  }
  
  noop() {}
  
  input_type() {
    const special_types = new Set(['select', 'textarea'])
    let nodeName = this.element.nodeName.toLowerCase()
    if (special_types.has(nodeName)) {
      return nodeName
    }
    if (nodeName === 'input') {
      return this.element.type
    }
    return 'generic'
  }
  
  get_param_value() {
    const url = new URL(window.location)
    return url.searchParams.get(this.paramNameValue) || ''
  }
  
  set_param_value(value) {
    console.log(`setting ${this.paramNameValue} to ${value}`)
    const url = new URL(window.location)
    url.searchParams.set(this.paramNameValue, value)
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
        checkbox.dataset.action = 'input->grid-saver#toggleCheckbox'
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

// Stimulus.register("checker", class extends Controller {
//   connect() {
//     console.log("It's-a-me!")
//     const url = new URL(window.location)
//     const my_arm = url.searchParams.get('asel')
//     this.param = `arm[${my_arm}]`
//     const b64_arr = url.searchParams.get(this.param) || ''
//     const checked_indexes = b64ToUint16(b64_arr)
//     console.log(`Found checked indexes: ${checked_indexes}`)
//     const my_index = parseInt(this.element.dataset.index)
    
//     this.element.checked = false
//     for (const cidx of checked_indexes) {
//       if (my_index === cidx) {
//         this.element.checked = true
//       }
//     }
//   }
  
//   toggle() {
//     console.log('toggling')
//     this.store_checked_values()
//   }
  
//   store_checked_values() {
//     const url = new URL(window.location)

//     const table = this.element.closest('table')
//     table.dispatchEvent(new Event('update'))
//   }
// })

Stimulus.register("grid-saver", class extends Controller {
  
  static targets = ['checkBox']
  
  connect() {
    // Don't do anything here actually 
  }
  
  toggleCheckbox(event) {
    console.log(`toggling ${event.target}`)
  }
  
  set_checks_from_url() {
    console.log(this.checkBoxTargets)    
  }
  
  store_checked_values() {
    const url = new URL(window.location)
    const param = `arm[${url.searchParams.get('asel')}]`

    const checked = Array.from(this.element.querySelectorAll('input[type=checkbox]:checked'))
    const checked_ar = checked.map(e => e.dataset.index)
    console.log(`checked indexes: ${checked_ar}`)
    const typed_ar = Uint16Array.from(checked_ar)

    url.searchParams.set(param, Uint16Tob64(typed_ar))
    history.replaceState({}, '', url)    
  }
})

Stimulus.register("gridcopy", class extends Controller {
  static targets = ['copyFrom']
  connect() {
    console.log("gridcopy is connected")
    console.log(this.copyFromTarget)
  }      
})

Stimulus.register("output", class extends Controller {
  connect() {
    console.log("haiiii")
  }
  
  update() {
    console.log("Updating outputs!")
  }
})

/* Convert a 2D array to a CSV data URL */

function array_to_csv_data_url(array) {
  const csv_txt = array_to_csv(array)
  return `data:text/csv;base64,${btoa(csv_txt)}`
}

/* Convert a 2D array to CSV, readable by Excel */

function array_to_csv(array) {
  const row_strings = array.map(row => {
    return row.map(cell => format_cell(cell)).join(",")
  })
  return row_strings.join("\r\n")
}

/* Format a single cell for CSV output */

function format_cell(cell) {
  const quoted = cell.replaceAll('"', '""')
  const newlined = quoted.replaceAll(/\r?\n/g, "\r\n")
  if (newlined.search(/[,\n"]/) >= 0) {
    return `"${newlined}"`
  }
  return newlined
}

/*\
|*|
|*|  Base64 / binary data / UTF-8 strings utilities
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
|*|
\*/

/* Array of bytes to Base64 string decoding */

function Uint16Tob64(ar) {
  return base64EncArr(new Uint8Array(ar.buffer))
}

function b64ToUint16(str) {
  return new Uint16Array(base64DecToArr(str, 2).buffer)
}

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