import sys
try:
    import docx
    print("python-docx OK", docx.__version__)
except Exception as ex:
    print("NO python-docx:", ex)
