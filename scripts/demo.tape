# VHS tape — generates .github/assets/demo.gif
# Run: vhs scripts/demo.tape

Output .github/assets/demo.gif

Set Theme "Catppuccin Mocha"
Set FontSize 16
Set FontFamily "JetBrainsMono Nerd Font Mono"
Set Width 1200
Set Height 760
Set Padding 24
Set TypingSpeed 20ms
Set PlaybackSpeed 1.0
Set Shell zsh
Set CursorBlink false

Hide
Type "clear"
Enter
Sleep 200ms
Show

Type "npx tsx scripts/demo-conversation.ts"
Sleep 500ms
Enter
Sleep 60s
