!macro customInit
  ; Override default installation directory to be directly in LocalAppData
  StrCpy $INSTDIR "$LOCALAPPDATA\Open Generative AI"
  
  ; Forcefully kill the app if it's running to prevent installation failure
  nsExec::ExecToStack 'taskkill /F /IM "Open Generative AI.exe"'
!macroend
