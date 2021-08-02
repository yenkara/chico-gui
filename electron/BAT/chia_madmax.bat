@ECHO OFF
                TITLE madmax-ploter
                SET hr=%time:~0,2%
                IF "%hr:~0,1%" equ " " set hr=0%hr:~1,1%
                SET DATETIME=Log_%date:~0,4%%date:~5,2%%date:~8,2%_%hr%%time:~3,2%%time:~6,2%
                SET LOG_FILE=logs/%DATETIME%.log
                IF NOT EXIST logs MKDIR logs
                IF NOT EXIST C:\temp\chia\ (MKDIR C:\temp\chia\) ELSE (DEL C:\temp\chia\*.tmp 2>nul)
                IF NOT EXIST C:\temp\chia\ (MKDIR C:\temp\chia\) ELSE (DEL C:\temp\chia\*.tmp 2>nul)
                IF NOT EXIST B:\chia\ (MKDIR B:\chia\) 
                powershell -c "$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'; B:\work\monstar\chico-gui-111\electron\madmax\chia_plot.exe -n 36 -r 23 -u 256 -t C:\temp\chia\ -2 C:\temp\chia\ -d B:\chia\ -f b4ff0fbb553caa823b8e5bd7a59effd5c01c6f5ece5d93b1c902f97914cf3481a5ddefd1e78532b8157e6c227a16d5fe -c xch156qlpwxdzh2a3s9ezyuqfk2raddusgvcqu40uyq0g2m2c3g77kfq98qjzh | tee '%LOG_FILE%'"