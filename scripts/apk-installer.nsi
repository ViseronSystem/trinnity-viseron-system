Unicode true
SetCompressor /SOLID lzma

!include "MUI2.nsh"

!ifndef APKVER
!define APKVER "5.0.0"
!endif

!define APPNAME "Trinnity Viseron"
!define COMPANY "Trinnity Viseron"
!define REGROOT "TrinnityViseron"

Name "${APPNAME} System v${APKVER} - APK"
OutFile "TrinnityViseron-APK-Setup-${APKVER}.exe"
InstallDir "$LOCALAPPDATA\Programs\TrinnityViseron"
InstallDirRegKey HKCU "Software\${REGROOT}\APK" "InstallDir"

VIProductVersion "${APKVER}.0.0"
VIAddVersionKey "ProductName" "${APPNAME} System"
VIAddVersionKey "CompanyName" "${COMPANY}"
VIAddVersionKey "FileDescription" "Instalador do APK Android ${APPNAME} v${APKVER}"
VIAddVersionKey "FileVersion" "${APKVER}"
VIAddVersionKey "ProductVersion" "${APKVER}"
VIAddVersionKey "LegalCopyright" "(c) 2026 ${COMPANY}"
VIAddVersionKey "OriginalFilename" "TrinnityViseron-APK-Setup-${APKVER}.exe"

Icon "icon.ico"

RequestExecutionLevel user

!define MUI_ABORTWARNING
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao instalador do APK TVS"
!define MUI_WELCOMEPAGE_TEXT "Este instalador coloca no seu PC o ficheiro APK Android v${APKVER} do Trinnity Viseron System, cria atalhos e abre as instrucoes de instalacao no telemovel.$\r$\n$\r$\nClique em Avancar para continuar."
!define MUI_FINISHPAGE_RUN "$INSTDIR\INSTRUCOES.html"
!define MUI_FINISHPAGE_RUN_TEXT "Abrir instrucoes de instalacao"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Portuguese"

Section "APK Trinnity Viseron" SecAPK
  SetOutPath "$INSTDIR"

  File "TrinnityViseron.apk"
  File "INSTRUCOES.html"
  File "instalar.bat"

  WriteUninstaller "$INSTDIR\Uninstall.exe"

  CreateDirectory "$SMPROGRAMS\${APPNAME}"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\Instrucoes de Instalacao.lnk" "$INSTDIR\INSTRUCOES.html"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\Abrir Pasta do APK.lnk" "$INSTDIR\instalar.bat"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\Desinstalar.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\${APPNAME} - Instalar no Telemovel.lnk" "$INSTDIR\INSTRUCOES.html"

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${REGROOT}APK" \
    "DisplayName" "${APPNAME} System - APK Android v${APKVER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${REGROOT}APK" \
    "DisplayIcon" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${REGROOT}APK" \
    "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${REGROOT}APK" \
    "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${REGROOT}APK" \
    "DisplayVersion" "${APKVER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${REGROOT}APK" \
    "Publisher" "${COMPANY}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${REGROOT}APK" \
    "EstimatedSize" "65536"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${REGROOT}APK" \
    "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${REGROOT}APK" \
    "NoRepair" 1

  WriteRegStr HKCU "Software\${REGROOT}\APK" "InstallDir" "$INSTDIR"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\Uninstall.exe"
  Delete "$INSTDIR\TrinnityViseron.apk"
  Delete "$INSTDIR\INSTRUCOES.html"
  Delete "$INSTDIR\instalar.bat"
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\${APPNAME}\Instrucoes de Instalacao.lnk"
  Delete "$SMPROGRAMS\${APPNAME}\Abrir Pasta do APK.lnk"
  Delete "$SMPROGRAMS\${APPNAME}\Desinstalar.lnk"
  RMDir "$SMPROGRAMS\${APPNAME}"
  Delete "$DESKTOP\${APPNAME} - Instalar no Telemovel.lnk"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${REGROOT}APK"
  DeleteRegKey HKCU "Software\${REGROOT}"
SectionEnd
