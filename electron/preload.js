const { contextBridge, ipcRenderer } = require('electron')
const os = require('./jsosutils.js')
const chia = require('./chia.js')

let processStatus = 'wait'
let terminalPID = ''
let processPID = ''
let targetDrive = ''


window.addEventListener('DOMContentLoaded', () => {
    const poolkeyInput = document.getElementById('pool-key')
    const farmerkeyInput = document.getElementById('farmer-key')
    const p2keyInput = document.getElementById('p2-key')
    const checkNFT = document.getElementById('check-nft')
    
    const readKeys = () => {
        let keys = chia.readKeys()
        poolkeyInput.value = keys.pool_public_key
        farmerkeyInput.value = keys.farmer_public_key
        p2keyInput.value = keys.p2_singleton_address
    }

    const keyCheck = () => {
        const poolkeySpan = document.getElementById('key-check-farmer')
        const farmerkeySpan = document.getElementById('key-check-pool')
        const p2keySpan = document.getElementById('key-check-p2')

        poolkeySpan.outerHTML = (poolkeyInput.value.length == 96)
        ? `<span class="key-check" id='key-check-pool' style="color: #00fa9a;">&#10004;</span>`
        : `<span class="key-check" id='key-check-pool' style="color: #dc143c;">&#10006;</span>`
        farmerkeySpan.outerHTML = (farmerkeyInput.value.length == 96)
        ? `<span class="key-check" id='key-check-farmer' style="color: #00fa9a;">&#10004;</span>`
        : `<span class="key-check" id='key-check-farmer' style="color: #dc143c;">&#10006;</span>`
        p2keySpan.outerHTML = (p2keyInput.value.length == 62)
        ? `<span class="key-check" id='key-check-p2' style="color: #00fa9a;">&#10004;</span>`
        : `<span class="key-check" id='key-check-p2' style="color: #dc143c;">&#10006;</span>`
    }

    const hiddenToggle = (str) => {
        const e = document.getElementById(`hidden-${str}`)
        e.hidden = (e.hidden == true)? false : true
    }

    os.updateMachineInfo()
    os.updateDiskInfo(document.getElementById('disk-info-all'))

    createThreadOption()

    readKeys()
    keyCheck()

    if (poolkeyInput.value == 'undefined' || farmerkeyInput.value == 'undefined' || p2keyInput == 'undefined') {
        chia.getKeys()
    }

    setInterval(() => {
        readKeys()
        keyCheck()
        os.updateMachineInfo()
        os.updateDiskInfo(document.getElementById('disk-info-all'))

        terminalPID = os.getTerminalPID()
        
        let r_process = os.getProcess()
        if (r_process != '') {
            processPID = r_process.pid
            updateProcessivity(r_process.progress)
        } else {
            processPID = ''
            updateProcessivity('0%')
        }

        if (processStatus == 'run') {
            processStatus = (processPID != '')? 'running' : (targetDrive == '')? 'stop' :'run'
        } 

        if (processStatus == 'running') {
            if (processPID == '') {
                if (terminalPID == ''){
                    runMadmax(checkNFT.checked)
                    processStatus = 'run'
                } else {
                    os.taskkill(terminalPID)
                }
            }
        }

        if (processStatus == 'stop') {
            processStatus = (processPID == '' & terminalPID == '')? 'stopped' : 'stop'

            if (processPID != '')
                os.taskkill(processPID)
            else
                os.taskkill(terminalPID)
        }

        if (processStatus == 'stopped') {
            processStatus = (processPID == '' & terminalPID == '')? 'wait' : 'stopped'

            startBtn.hidden = false
            stopBtn.hidden = true
        }

        
    },3000)

    const startBtn = document.getElementById('start')
    const stopBtn = document.getElementById('stop')

    startBtn.addEventListener('click', () => {
        if (checkNFT.checked == true) {
            checkNFT.checked = (p2keyInput.value.length == 62)? true : false        
        }
        startBtn.hidden = true
        stopBtn.hidden = false
        runMadmax(checkNFT.checked)
        processStatus = 'run'
    })

    stopBtn.addEventListener('click', () => {
        processStatus = 'stop'
    })

    document.getElementById('keylabel-farmer').addEventListener('click', () => { hiddenToggle('farmerkey') })
    document.getElementById('keylabel-pool').addEventListener('click', () => { hiddenToggle('poolkey') })
    document.getElementById('keylabel-p2').addEventListener('click', () => { hiddenToggle('p2') })
    document.getElementById('support').addEventListener('click', () => { 
        hiddenToggle('bg-black')
        hiddenToggle('support')
    })
    document.getElementById('hidden-bg-black').addEventListener('click', () => { 
        hiddenToggle('bg-black')
        hiddenToggle('support')
    })

    document.getElementById('select-temp1').addEventListener('change', () => {
        let temp = document.getElementById('select-temp1').value
        selectTemp(temp, "")
    })
    document.getElementById('select-temp2').addEventListener('change', () => {
        let temp = document.getElementById('select-temp2').value
        selectTemp("", temp)
    })

    checkNFT.checked = (p2keyInput.value.length == 62)? true : false
})

const runMadmax = (nft) => {
    targetDrive = chia.createMadmaxScripts(nft)    

    if (targetDrive != '') {
        chia.runMadmax(targetDrive)
    }

    document.querySelector('.properties .final #final').textContent = targetDrive
    document.querySelector('.properties .final #final').addEventListener('click', () => {
        goPath(targetDrive)
    })
    document.querySelector('.properties .final #final').style.curser = 'pointer'
}

const createThreadOption = () => {
    const addOption = (select, num, selected) => {
        let o = document.createElement('option')

        o.value = num
        o.text = num
        o.selected = selected
        
        select.append(o)
    }

    const threadSelect = document.getElementById('use_thread')
    const count = os.getThread()

    addOption(threadSelect, count, false)
    addOption(threadSelect, count-1, true)
    addOption(threadSelect, count/2, false)
    addOption(threadSelect, (count/2)-1, false)
}

function selectTemp(t1, t2) {
    let temp1 = t1
    let temp2 = t2
    let temp1Sel = document.getElementById('select-temp1')
    let temp2Sel = document.getElementById('select-temp2')

    const setTemp = (temp, num) => {
        if (temp == "") {
            for (const e of document.getElementsByName('temp'+num)) {
                if (e.checked == true) {
                    if (num == 1) temp1 = e.value
                    if (num == 2) temp2 = e.value
                    temp = e.value
                    break
                }
            }
        } else {
            for (const e of document.getElementsByName('temp'+num)) {
                if (e.value == temp){
                    e.checked = true
                    break
                }
    
            }
        }
    }
    
    setTemp(temp1, 1, temp1Sel)
    setTemp(temp2, 2, temp2Sel)

    for (const check of document.querySelectorAll('.check')) {
      let temp = check.checked
      check.checked = (check.value == temp1 || check.value == temp2)? false : temp
      check.disabled = (check.value == 'C:' || check.value == temp1 || check.value == temp2)? true : false
    }

    if (temp1 != temp1Sel.value) {
        for (const o of temp1Sel.options) {
            if (o.value == temp1) {
                o.selected = true
                break
            }
        }
    }
        
    if (temp2 != temp2Sel.value) {
        for (const o of temp2Sel.options) {
            if (o.value == temp2) {
                o.selected = true
                break
            }
        }
    }
}

const showDropBox = (target) => {
    const btn = document.getElementById(`down_${target}`)
    const dropBox = document.getElementById(`drop_box_${target}`)

    btn.textContent = (btn.textContent == '▼')? '▲' : '▼'
    dropBox.style.display = (dropBox.style.display == 'none')? 'block' : 'none'
}

const goPath = (str) => {
    os.goPath(str)
}

const updateProcessivity = prog => {
    document.getElementById(`process-text`).innerHTML = prog
    document.getElementById(`process-prog`).innerHTML = prog
    document.getElementById(`process-prog`).value = prog.split('%')[0]
}

contextBridge.exposeInMainWorld(
    'api',
    {
        getKeys: () => chia.getKeys(),
        createMadmaxScript: () => chia.createMadmaxScripts(),
        runMadmax: () => chia.runMadmax(),
        selectTemp,
        goPath,
        showDropBox,
        getProcess: () => os.getProcess()
    }
)

