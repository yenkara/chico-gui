const child_process = require('child_process')
const fs = require('fs')

exports.getKeys = () => {
    child_process.execFileSync(__dirname+'\\bat\\chia_keys_show.bat')
}

exports.readKeys = () => {
    let farmer_public_key, pool_public_key, p2_singleton_address
    try {
        for (const line of fs.readFileSync('c:\\temp\\chiakeys.txt','utf-8').split('\n')) {
            if (line.includes('Farmer')) {
                let text = line.split(' ')
                farmer_public_key = text[text.length-1]
            }
            if (line.includes('Pool')) {
                let text = line.split(' ')
                pool_public_key = text[text.length-1]
            }
        }
        for (const line of fs.readFileSync('c:\\temp\\chiaplotnft.txt','utf-8').split('\n')) {
            if (line.includes('contract address')) {
                let text = line.split(' ')
                p2_singleton_address = text[text.length-1]
            }
        }
    } catch (e) {
        
    }

    return {farmer_public_key, pool_public_key, p2_singleton_address}
}

exports.runMadmax = (str) => {
    fs.writeFileSync(
        `${__dirname}\\bat\\run_madmax.bat`,
        `
        CD %AppData%\\..\\Local\\chia-blockchain\\app-*\\resources\\app.asar.unpacked\\daemon\\
        chia plots add -d ${str}\\chia\\
        start ${__dirname}\\bat\\chia_madmax.bat`,
        'utf8',
        err => { if (err !== null) console.log(err) }
    )
    let process = child_process.spawn(__dirname+'\\bat\\run_madmax.bat')
}

exports.createMadmaxScripts = (nft) => {
    for (const info of document.querySelectorAll('.disk-info .check')) {
        if (info.checked == true){
            const str = info.value
            const p2 = document.getElementById('p2-key').value
            const poolkey = document.getElementById('pool-key').value
            const farmerkey = document.getElementById('farmer-key').value
            const plot_count = document.getElementById('plot_count_'+str).innerText
            const max_plot_count = document.getElementById('max_plot_count_'+str).innerText
            const final_dir = `${str}\\chia\\`
            const use_thread = document.getElementById('use_thread').value
            const create_count = max_plot_count - plot_count
            const tempToggleCheck = document.getElementById('check-temp').checkecd;

            let temp1 = ''
            let temp2 = ''
            
            for (const e of document.getElementsByName('temp1')) {
                if (e.checked == true) {
                    temp1 = e.value + '\\temp\\chia\\'
                    break
                }
            }
          
            for (const e of document.getElementsByName('temp2')) {
                if (e.checked == true) {
                    temp2 = e.value + '\\temp\\chia\\'
                    break
                }
            }

            if (temp2 == '') temp2 = temp1

            let temptoggle = (tempToggleCheck)? ' -G true' : ''

            fs.writeFile(__dirname+'\\bat\\chia_madmax.bat',
                `@ECHO OFF
                TITLE madmax-ploter
                SET hr=%time:~0,2%
                IF "%hr:~0,1%" equ " " set hr=0%hr:~1,1%
                SET DATETIME=Log_%date:~0,4%%date:~5,2%%date:~8,2%_%hr%%time:~3,2%%time:~6,2%
                SET LOG_FILE=logs/%DATETIME%.log
                IF NOT EXIST logs MKDIR logs
                IF NOT EXIST ${temp1} (MKDIR ${temp1}) ELSE (DEL ${temp1}*.tmp 2>nul)
                IF NOT EXIST ${temp2} (MKDIR ${temp2}) ELSE (DEL ${temp2}*.tmp 2>nul)
                IF NOT EXIST ${final_dir} (MKDIR ${final_dir}) 
                powershell -c "$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'; ${__dirname}\\madmax\\chia_plot.exe -K 2 -n ${create_count} -r ${use_thread} -u 256 -t ${temp1} -2 ${temp2}${temptoggle} -d ${final_dir} -f ${farmerkey} ${(nft)? '-c '+p2 : '-p '+poolkey} | tee '%LOG_FILE%'"`,
                'utf8',
                err => { if (err !== null) console.log(err) }
            )

            return str
        } else {
            fs.writeFile(__dirname+'\\bat\\chia_madmax.bat', 
                '',
                'utf8',
                err => { if (err !== null) console.log(err) }
            )
        }
    }

    return ''
}