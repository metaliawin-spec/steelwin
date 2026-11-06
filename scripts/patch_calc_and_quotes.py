# Patch script for calculation.js and quotations.js
import os
import re

calc_path = 'js/modules/calculation.js'
quotes_path = 'js/modules/quotations.js'

print('Checking files...')
assert os.path.exists(calc_path), 'calculation.js not found'
assert os.path.exists(quotes_path), 'quotations.js not found'
print('Files found.')
