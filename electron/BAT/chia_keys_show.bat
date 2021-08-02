@ECHO OFF
IF NOT "%1"=="am_admin" (powershell start -verb runas '%0' am_admin & exit /b)
IF NOT EXIST c:\temp (MKDIR c:\temp) 
IF EXIST c:\temp\chiakeys.txt (del c:\temp\chiakeys.txt)
IF EXIST c:\temp\chiaplotnft.txt (del c:\temp\chiaplotnft.txt)
CD %AppData%\..\Local\chia-blockchain\app-*\resources\app.asar.unpacked\daemon\
chia keys show > c:\temp\chiakeys.txt
chia plotnft show > c:\temp\chiaplotnft.txt