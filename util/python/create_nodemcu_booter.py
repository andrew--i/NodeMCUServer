lines = []
lines.append('s = \'\'\n')
with open('boot_origin.py', 'r') as f:
    for line in f:
        newLine = ''
        for ch in line:
            if ch == "'":
                newLine = newLine +"\\'"
            elif ch == '\n':
                newLine = newLine +"\\n'\n"
            else:
                newLine = newLine + ch
        newLine = "s = s + '" + newLine
        lines.append(newLine)

lines.append('\nwith open(\'boot.py\',\'w\') as f:\n')
lines.append('    f.write(s)')

with open('boot.py', 'w') as f:
    for line in lines:
        f.write(line)

