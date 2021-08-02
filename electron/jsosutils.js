const diskinfo = require('node-disk-info')
const fs = require('fs')
var os = require('os');
const { exec, execSync } = require('child_process');
const { privateDecrypt } = require('crypto');

const getDisk = function(){
    let result = []

    for (const drive of diskinfo.getDiskInfoSync()) {

        let plot_count = 0
        let files
    
        try {
            files = fs.readdirSync(drive.mounted+'/chia')
        } catch (e) {
            files = []
        }
    
        for (const file of files) {
            let str = file.split('.')
            if (str[str.length-1] === 'plot') {
                plot_count++
            } else {
                // fs.unlinkSync(drive.mounted+'/chia/'+file)
            }
        }
    
        let available_plot_count = Math.floor(drive.available/108900000000)
        let max_plot_count = available_plot_count+plot_count
        let used = Math.round(drive.used/1024/1024/1024)
        let size = Math.round(drive.available/1024/1024/1024)+used
        
        // console.log(`${drive.mounted} ${used}GB/${size}GB \t capacity:${drive.capacity} \t plot count:${plot_count}/${max_plot_count} \t `)
    
        result.push({
            str : drive.mounted,
            used, size,
            capacity : drive.capacity,
            plot_count,
            max_plot_count,
            action : 0
        })
    }
    return result
}

exports.getThread = () => {
    return os.cpus().length
}

exports.updateMachineInfo = () => {
    let cpu = {
        name : os.cpus().pop().model,
        num : os.cpus().length
    }
    let freemem = os.freemem()/1024/1024/1024
    let totalmem = os.totalmem()/1024/1024/1024
    let usemem = Math.ceil((totalmem-freemem)*10)/10

    document.querySelector('.cpu .name').textContent = cpu.name;
    document.querySelector('.ram .capacity').textContent = `${usemem} GB / ${Math.ceil(totalmem)} GB`
    document.querySelector('.thread-count').textContent = cpu.num;
}


exports.updateDiskInfo = (old) => {
    const addSelectOption = (select, value, selected) => {
        let o = document.createElement('option')

        o.value = value
        o.text = value
        o.selected = selected
        
        select.append(o)
    }

    const showSize = (size) => {
        if (size > 1000)
            return Math.round(size/1024*100)/100 + ' TB'
        else
            return size + ' GB'
    }

    const newDisk = (info) => {
    return `
    <div class="disk-info" id='${info.str}'>
            <div class="info">
                <input type="checkbox" class="check final" id='check-${info.str}' value='${info.str}' ${(info.str === 'C:' || info.str === 'D:')? 'disabled':(info.plot_count < info.max_plot_count)? 'checked': ''}>
                <div class="str">${info.str}</div>
                <div class="down" id='down_${info.str}' onclick='window.api.showDropBox("${info.str}")' style="display:none;">▼</div>
                <div class="size" id='size_${info.str}'>${showSize(info.size)}</div>
                <div class="s" >/</div>
                <div class="used" id='used_${info.str}'>${showSize(info.used)}</div>
                <progress class='capacity' id="capacity_${info.str}" max="100" value="${info.capacity.split('%')[0]}">${info.capacity}</progress>
            </div>
            <div class="dropbox" id='drop_box_${info.str}'>
                <div class="plots" onclick='window.api.goPath("${info.str}")'>
                    <label>Plots Count</label>
                    <div class="max_plot_count" id='max_plot_count_${info.str}'>${info.max_plot_count}</div>
                    <div class="s" >/</div>
                    <div class="plot_count" id='plot_count_${info.str}'>${info.plot_count}</div>
                </div>
                <div class="role" style="display:none">
                    <label>Select Temp</label>
                    <div class="radioBtn">
                        <label>T2</label>
                        <input type="radio" name="temp2" class="temp2" value='${info.str}' onchange='window.api.selectTemp("","${info.str}")' ${(info.str === 'D:')? 'checked': ''}>
                    </div>
                    <div class="radioBtn">
                        <label>T1</label>
                        <input type="radio" name="temp1" class="temp1" value='${info.str}' onchange='window.api.selectTemp("${info.str}","")' ${(info.str === 'D:')? 'checked': ''}>
                    </div>
                </div>
            </div>
        </div>
    `
    }

    let diskArea = document.querySelector('.disk-area')
    let temp1 = document.getElementById('select-temp1')
    let temp2 = document.getElementById('select-temp2')
    let newInfo = getDisk()
    let html = ``

    if (old.value === '') {
        for (const info of newInfo) {
            html += newDisk(info)
            addSelectOption(temp1,info.str,(info.str === 'D:')? true : false)
            addSelectOption(temp2,info.str,(info.str === 'D:')? true : false)
        }
        diskArea.innerHTML = html
        old.value = JSON.stringify(newInfo)
    } else {
        for (const oldInfo of JSON.parse(old.value)) {
            let temp = 0
            for (const info of newInfo) {
                if (oldInfo.str == info.str) {
                    temp = 1

                    try {
                        document.getElementById(`used_${info.str}`).textContent = showSize(info.used)
                        document.getElementById(`size_${info.str}`).textContent = showSize(info.size)
                        document.getElementById(`plot_count_${info.str}`).textContent = info.plot_count
                        document.getElementById(`max_plot_count_${info.str}`).textContent = info.max_plot_count
                        document.getElementById(`capacity_${info.str}`).innerHTML = info.capacity
                        document.getElementById(`capacity_${info.str}`).value = info.capacity.split('%')[0]
                        
                        const check = document.getElementById(`check-${info.str}`)
                        
                        check.checked = (check.checked == true & info.plot_count < info.max_plot_count)? true : false
                    } catch (e) {
                        let div = document.createElement('div')
                        diskArea.appendChild(div)
                        div.outerHTML = newDisk(info)
                    }

                    break
                }
            }

            if (temp == 0) {
                diskArea.removeChild(document.getElementById(oldInfo.str))
            }
        }

        old.value = JSON.stringify(newInfo)
    }
}

exports.getProcessPID = () => {
    let result = ''
    try {
        const logfiles = fs.readdirSync(`.\\logs\\`)
        const target = logfiles[logfiles.length-1]

        let pid = ''

        for (const line of fs.readFileSync(`.\\logs\\${target}`,'utf-8').split('\n')) {
            const str = line.split(' ')
            if (str[0] == 'Process') {
                pid = str[2]
                break
            }
        }

        let stdout = execSync(`tasklist /fi "pid eq ${pid}"`)
    
        result = (stdout.toString().split('\n')[3].split(' ')[0] == 'chia_plot.exe')? pid : ''
    } catch (e) {
        result = ''
    }

    return result
}

exports.getProcess = () => {
    let result = ''
    let pid = ''
    let progress = '0%'
    try {
        const logfiles = fs.readdirSync(`.\\logs\\`)
        const target = logfiles[logfiles.length-1]
        const file = fs.readFileSync(`.\\logs\\${target}`,'utf-8').split('\n')

        for (const line of file) {
            const str = line.split(' ')
            if (str[0] == 'Process') {
                pid = str[2]
                break
            }
        }

        let stdout = execSync(`tasklist /fi "pid eq ${pid}"`)

        if (stdout.toString().split('\n')[3].split(' ')[0] == 'chia_plot.exe') {
            result = pid

            for (let i = file.length-1; i > 0; i--) {
                const line = file[i].split(' ')
                if (line[0].includes('Plot')) {
                    progress = '1%'
                    break
                } else if (line[0].includes('P1')) {
                    if (line[2] == '1') {
                        progress ='2%'
                        break
                    } else if (line[2] == '2') {
                        progress ='8%'
                        break
                    } else if (line[2] == '3') {
                        progress ='17%'
                        break
                    } else if (line[2] == '4') {
                        progress ='24%'
                        break
                    } else if (line[2] == '5') {
                        progress ='32%'
                        break
                    } else if (line[2] == '6') {
                        progress ='40%'
                        break
                    } else if (line[2] == '7') {
                        progress ='50%'
                        break
                    }
                } else if (line[0].includes('P2')) {
                    if (line[2] == '2') {
                        progress ='70%'
                        break
                    } else if (line[2] == '3') {
                        progress ='67%'
                        break
                    } else if (line[2] == '4') {
                        progress ='63%'
                        break
                    } else if (line[2] == '5') {
                        progress ='60%'
                        break
                    } else if (line[2] == '6') {
                        progress ='56%'
                        break
                    } else if (line[2] == '7') {
                        progress ='53%'
                        break
                    }
                } else if (line[0].includes('P3')) {
                    if (line[2] == '2') {
                        progress ='90%'
                        break
                    } else if (line[2] == '3') {
                        progress ='87%'
                        break
                    } else if (line[2] == '4') {
                        progress ='83%'
                        break
                    } else if (line[2] == '5') {
                        progress ='80%'
                        break
                    } else if (line[2] == '6') {
                        progress ='76%'
                        break
                    } else if (line[2] == '7') {
                        progress ='73%'
                        break
                    }
                } else if (line[0].includes('P4')) {
                    if (line[1] == 'Starting') {
                        progress ='91%'
                        break
                    } else if (line[1] == 'Writing') {
                        progress ='95%'
                        break
                    } else if (line[1] == 'Finished') {
                        if (line[3] == 'C1') progress ='94%'
                        else progress ='99%'
                        break
                    }
                } else if (line[0] == 'Total') {
                    progress ='100%'
                    break
                }
            }
        }
    } catch (e) {
        result = ''
    }

    return (result == '')? '' : {pid,progress}
}

exports.getTerminalPID = () => {
    let result = ''
    try {
        let comend = `tasklist /fi "windowtitle eq madmax-ploter"`
        let stdout = execSync(comend)
    
        result = stdout.toString().split('\n')[3].replace(/ /gi,'').split('cmd.exe')[1].split('Console')[0]

    } catch (e) {
        result = ''
    }

    return result
}

exports.taskkill = (pid) => {
    if (pid != '') {
        // console.log(`taskkill /f /pid ${pid}`)
        execSync(`taskkill /f /pid ${pid}`)
    }
}

exports.goPath = (str) => {
    execSync(`IF NOT EXIST ${str}\\chia (MKDIR ${str}\\chia)`)
    execSync(`start ${str}\\chia`)
}