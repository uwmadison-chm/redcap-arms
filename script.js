//"use strict";

import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"

console.log(Papa)

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
    this.element.dataset.placeholderEditedValue = "true"
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

Stimulus.register("placeholder", class extends Controller {
  static values = {
    text: String,
    edited: Boolean
  }
  
  connect() {
    console.log(`connected placeholder for ${this.element}`)
    if (this.element.innerText.trim() === '') {
      this.editedValue = false
    }
    this.setPlaceholder()
  }
  
  setPlaceholder() {
    if (!this.editedValue || this.element.innerText.trim() === '') {
      this.element.innerText = this.textValue
      this.element.classList.add('placeholder')
    }    
  }
  
  update() {
    this.element.classList.remove('placeholder')
  }
  
  focus() {
    console.log('focus')
    if (!this.editedValue) {
      console.log('Clearing')
      this.element.innerText = ''
      let range = document.createRange()
      let sel = window.getSelection()
      range.setStart(this.element, 0)
      range.setEnd(this.element, 0)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }
  
  blur() {
    console.log('blur')
    if (this.element.innerText.trim() === '') {
      this.editedValue = false
      this.setPlaceholder()
    }
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
      cell.classList.add('row')
      cell.innerText = instruments[ins_idx]
      row.appendChild(cell)
      for (let evt_idx = 0; evt_idx < events.length; evt_idx++) {
        cell = document.createElement('td')
        let checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.dataset.index = flat_idx
        checkbox.dataset.event = evt_idx
        checkbox.dataset.instrument = ins_idx
        checkbox.dataset.action = 'grid-url-sync#toggleCheckbox'
        checkbox.dataset.gridUrlSyncTarget = 'checkBox'
        cell.appendChild(checkbox)
        row.appendChild(cell)
        flat_idx++
      }
      table.appendChild(row)
    }
    table.dispatchEvent(new Event('initialize'))
  }
  
  make_event_header(events) {
    let row = document.createElement('tr')
    row.appendChild(document.createElement('th'))
    for(let ei = 0; ei < events.length; ei++) {
      let cell = document.createElement('th')
      cell.classList.add('rotate')
      cell.innerHTML = `<div><span>${events[ei]}</div></span>`
      row.appendChild(cell)
    }
    return row
  }
})

Stimulus.register("grid-url-sync", class extends Controller {
  
  static targets = ['checkBox']
  
  toggleCheckbox(event) {
    this.store_checked_values()
  }
  
  setChecksFromURL() {
    const url = new URL(window.location)
    console.log(`Setting checks from url, param = ${this.paramName}`)
    const b64Array = url.searchParams.get(this.paramName)
    console.log(b64Array)
    if (!b64Array) { return }
    const checked_ar = b64ToUint16(b64Array)
    const boxes = this.checkBoxTargets
    console.log(boxes)
    for (const box of boxes) {
      box.checked = false
    }
    for (const chk_idx of checked_ar) {
      console.log(chk_idx)
      boxes[chk_idx].checked = true
    }
  }
  
  store_checked_values() {
    const url = new URL(window.location)
    const checked_boxes = this.checkBoxTargets.filter(box => box.checked)
    const checked_ar = checked_boxes.map((box) => box.dataset.index)
    console.log(`checked indexes: ${checked_ar}`)
    const typed_ar = Uint16Array.from(checked_ar)
    const b64Array = Uint16Tob64(typed_ar)
    console.log(b64Array)
    url.searchParams.set(this.paramName, b64Array)
    history.replaceState({}, '', url)    
  }
  
  get paramName() {
    const url = new URL(window.location)    
    return `arm[${url.searchParams.get('asel')}]`
  }
  
  
  
})

Stimulus.register("grid-copier", class extends Controller {
  static targets = ['select', 'button']
  connect() {
    console.log(`grid-copier is connected: ${this.selectTarget} ${this.buttonTarget}`)
    this.setButtonActive()
  }
  
  setButtonActive() {
    this.buttonTarget.disabled = true
    console.log(this.selectTarget.value)
    if (this.selectTarget.value.trim() !== '') {
      this.buttonTarget.disabled = false
    }
  }
  
  copy() {
    const url = new URL(window.location)
    const asel = url.searchParams.get('asel')
    const copyFromParam = `arm[${asel}]`
    const copyToParam = `arm[${this.selectTarget.value}]`
    console.log(`${copyFromParam} -> ${copyToParam}`)
    url.searchParams.set(copyToParam, url.searchParams.get(copyFromParam))
    history.replaceState({}, '', url)
  }
})

Stimulus.register("armcopy-sync", class extends Controller {
  static targets = ['select']
  static values = {
    param: String
  }
  
  connect() {
    console.log("armcopy-sync is connected")
    this.update()
  }
  
  update() {
    console.log(`Updating armcopy-sync, param: ${this.paramValue}`)
    const url = new URL(window.location)
    const armsText = url.searchParams.get(this.paramValue)
    const armsList = armsText.split(",")
    this.selectTarget.innerHTML = ''
    const blank = document.createElement("option")
    this.selectTarget.appendChild(blank)
    for (const arm of armsList) {
      const opt = document.createElement("option")
      opt.value = arm
      opt.innerText = arm
      this.selectTarget.appendChild(opt)
    }
    console.log(`Now selectTarget is ${this.selectTarget}`)
  }
})

Stimulus.register("redcap-import", class extends Controller {
  
  static targets = [
    'importFile',
    'button'
  ]
  
  static values = {
    nameElementId: String,
    instrumentsElementId: String,
    eventsElementId: String,
    armsElementId: String
  }
  
  connect() {
    this.setButtonActive()
  }
  
  setButtonActive() {
    if (this.importFileTarget.files[0]) {
      this.buttonTarget.disabled = false
    } else {
     this.buttonTarget.disabled = true
    }
  }
  
  doImport() {
    if (!this.importFileTarget.files[0]) { return }
    this.importFileTarget.files[0].text().then(text => {
      const parser = new window.DOMParser()
      this.rcDoc = parser.parseFromString(text, 'application/xml')
      window.rcDoc = this.rcDoc
      console.log(this.rcDoc)
      this.importName()
      this.importInstruments()
      this.importEvents()
      this.importArms()
      this.importEventMapping()
    })
  }
  
  importName() {
    console.log(name)
    const elt = document.getElementById(this.nameElementIdValue)
    elt.innerHTML = name
    elt.dispatchEvent(new Event('input'))
  }

  importInstruments() {
    const instruments = uniques(this.rcDoc.querySelectorAll('FormDef')).map(elt => elt.getAttribute('redcap:FormName'))
    this.instruments = instruments
    const valStr = instruments.join("\n")
    const elt = document.getElementById(this.instrumentsElementIdValue)
    elt.value = valStr
    elt.dispatchEvent(new Event('input'))

  }

  importEvents() {
    const eventsArms = Array.from(this.rcDoc.querySelectorAll('StudyEventDef')).map(elt => elt.getAttribute('redcap:EventName'))
    const events = uniques(eventsArms.map(s => s.split("__")[0]))
    this.events = events
    console.log(`set this.events to ${this.events}`)
    const valStr = events.join("\n")
    const elt = document.getElementById(this.eventsElementIdValue)
    elt.value = valStr
    elt.dispatchEvent(new Event('input'))
  }

  importArms() {
    const eventsArms = Array.from(this.rcDoc.querySelectorAll('StudyEventDef')).map(elt => elt.getAttribute('redcap:EventName'))
    // Convert to a Set to make the items unique
    // Also if there's no arm set, assume "arm_1" for a default
    let arms = uniques(eventsArms.map(s => s.split("__")[1] || 'arm_1'))
    this.arms = arms
    console.log(`Setting arms to ${this.arms}`)
    const valStr = arms.join("\n")
    const elt = document.getElementById(this.armsElementIdValue)
    elt.value = valStr
    elt.dispatchEvent(new Event('input'))

  }
  
  importEventMapping() {
    /*
    * Look at StudyEventDef items
    * Split into arm, event pairs
    * We can't import mappings without importing arms and instruments and events too
    * Okay so we look at StudyEventDef and redcap:EventName
    * That will give us event and arm names
    * They look like event__arm
    * Split on __, assume "arm_1" for blank arms
    * Also get instruments from FormDef and redcap:FormName, that will get
      instruments in form order
    * Invert that baby, get a form:index map
    * Then in each StudyEventDef, look at all FormRefs and redcap:FormName    
    */
    console.log("Importing event mapping!")
    const instEventFlatIndexes = {}
    const armMappings = {}
    let flatIdx = 0
    this.instruments.forEach(instrument => {
      instEventFlatIndexes[instrument] = {}
      this.events.forEach(event => {
        instEventFlatIndexes[instrument][event] = flatIdx
        flatIdx++
      })
    })
    console.log(instEventFlatIndexes)
    const studyEventDefs = Array.from(this.rcDoc.querySelectorAll('StudyEventDef'))
    for (const studyEventDef of studyEventDefs) {
      const eventArm = studyEventDef.getAttribute('redcap:EventName').split("__")
      const event = eventArm[0]
      const arm = eventArm[1] || 'arm_1'
      armMappings[arm] ||= []
      console.log(`Working on arm ${arm} and event ${event}`)

      const formRefs = Array.from(studyEventDef.querySelectorAll('FormRef'))
      for (const formRef of formRefs) {
        const instrument = formRef.getAttribute('redcap:FormName')
        const idx = instEventFlatIndexes[instrument][event]
        armMappings[arm].push(idx)
      }
    }
    armMappings.for((k, v) => {
      console.log(k)
      console.log(v)
    })
  }
  
  
})

Stimulus.register('output', class extends Controller {
  static values = {
    armsParam: String,
    eventsParam: String,
    instrumentsParam: String,
    armKeyParam: String,
    nameParam: String
  }
  
  connect() {
    console.log("Connected output")
  }
  
  buildEvents(event) {
    console.log("Building event list CSV")
    const fullMapping = this.armEventInstrumentMap()
    const armEventStrings = fullMapping.map(row => `${row[1]}__${row[0]}`)
    const uniqued = uniques(armEventStrings)
    const outputArray = Array.from(uniqued).map((eStr, i) => {
      return {
        'event_name': eStr, 'arm_num': '1', 'day_offset': i, 'offset_min': '0', 'unique_event_name': `${eStr}_arm_1`, 'custom_event_label': ''
      }
    })
    event.currentTarget.setAttribute("download", `${this.nameFromURL}_events.csv`)
    event.currentTarget.setAttribute("href", array_to_csv_data_url(outputArray))
  }
  
  buildInstrumentMapping() {
    console.log("Building instrument mapping CSV")
    const fullMapping = this.armEventInstrumentMap()
    const outputArray = fullMapping.map(row => {
      return {
        'arm_num': '1',
        'unique_event_name': `${row[1]}__${row[0]}_arm_1`,
        'form': row[2]
      }
    })
    event.currentTarget.setAttribute("download", `${this.nameFromURL}_instrument_mapping.csv`)
    event.currentTarget.setAttribute('href', array_to_csv_data_url(outputArray))
  }
  
  armEventInstrumentMap() {
    // Return an array of [arm, event, instrument]
    const output = []
    for (const arm of this.armsFromURL) {
      const instrumentEvents = this.instrumentEventsForArm(arm)
      for (const [inst, ev] of instrumentEvents) {
        output.push([arm, ev, inst])
      }
    }
    return output
  }
  
  instrumentEventsForArm(arm) {
    const url = new URL(window.location)
    const param = `${this.armKeyParamValue}[${arm}]`
    const indexesb64 = url.searchParams.get(param)
    if (!indexesb64) { return }
    const selectedIndexes = b64ToUint16(indexesb64)
    const indexesTF = []
    for (const ix of selectedIndexes) { indexesTF[ix] = true }
    const events = this.eventsFromURL
    const instruments = this.instrumentsFromURL
    
    // Need to do the [inst, ev] order to make the array indexes match up
    const i_e = cartesian(instruments, events)
    
    return i_e.filter((item, index) => indexesTF[index])
  }
  
  get nameFromURL() {
    const url = new URL(window.location)
    return url.searchParams.get(this.nameParamValue) || 'project'
  }
  
  get eventsFromURL() {
    const url = new URL(window.location)
    return url.searchParams.get(this.eventsParamValue).split(",").map(e => rcSafe(e))
  }
  
  get armsFromURL() {
    const url = new URL(window.location)
    return url.searchParams.get(this.armsParamValue).split(",").map(e => rcSafe(e))
  }
  
  get instrumentsFromURL() {
    const url = new URL(window.location)
    return url.searchParams.get(this.instrumentsParamValue).split(",").map(e => rcSafe(e))
  }
  
})

function rcSafe(str) {
  return str.toLowerCase().replaceAll(/[^a-zA-Z0-9]+/g, '_')
}

function uniques(listlike) {
  return Array.from(new Set(listlike))
}
window.uniques = uniques


// Compute the cartesian product of arrays
// https://stackoverflow.com/a/43053803
const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())))
window.cartesian = cartesian

function nestEventInstrumentIndex(index, num_events) {
  return [index % num_events, Math.floor(index / num_events)]
}

window.nestEventInstrumentIndex = nestEventInstrumentIndex

/* Convert a 2D array to a CSV data URL */

function array_to_csv_data_url(array) {
  const csv_txt = Papa.unparse(array)
  return `data:text/csv;base64,${btoa(csv_txt)}`
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