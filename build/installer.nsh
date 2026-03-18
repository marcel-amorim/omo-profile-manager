; NSIS Installer Script for OMO Profile Manager
; This file adds custom steps to the Windows installer

!macro customInstall
  ; Create config directory if it doesn't exist
  CreateDirectory "$LOCALAPPDATA\\omo-profile-manager"
  
  ; Create shortcuts
  CreateShortcut "$DESKTOP\\OMO Profile Manager.lnk" "$INSTDIR\\OMO Profile Manager.exe"
!macroend

!macro customUnInstall
  ; Remove config directory on uninstall (optional - user data)
  ; RMDir /r "$LOCALAPPDATA\\omo-profile-manager"
  
  ; Remove desktop shortcut
  Delete "$DESKTOP\\OMO Profile Manager.lnk"
!macroend
