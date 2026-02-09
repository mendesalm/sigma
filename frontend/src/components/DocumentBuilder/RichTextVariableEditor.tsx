import React, { useMemo, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Box, Paper, IconButton, Tooltip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Switch, Grid } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Custom styles for the editor to look like a document page
import './RichTextVariableEditor.css'; 

// Custom Blot for Variables
const Embed = Quill.import('blots/embed');

// Register Size as Style Attributor
const SizeStyle = Quill.import('attributors/style/size');
const sizeWhitelist = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '24pt', '30pt', '36pt', '48pt', '60pt', '72pt', '96pt'];
SizeStyle.whitelist = sizeWhitelist;
Quill.register(SizeStyle, true);

// Register Font as Style Attributor
const FontStyle = Quill.import('attributors/style/font');
const fontWhitelist = [
  'arial', 
  'times-new-roman', 
  'courier-new', 
  'georgia', 
  'verdana', 
  'tahoma', 
  'trebuchet-ms',
  'alfa-slab-one',
  'cal-sans',
  'cinzel-decorative',
  'dm-serif-text',
  'great-vibes',
  'kapakana',
  'lexend-deca',
  'manufacturing-consent',
  'meie-script',
  'noto-sans',
  'oleo-script',
  'open-sans',
  'parisienne',
  'poppins',
  'prata',
  'roboto',
  'source-sans-3',
  'tangerine',
  'tinos',
  'unifrakturmaguntia'
];
FontStyle.whitelist = fontWhitelist;
Quill.register(FontStyle, true);

// Register Line Height
const Parchment = Quill.import('parchment');
const LineHeightStyle = new Parchment.Attributor.Style('line-height', 'line-height', {
  scope: Parchment.Scope.BLOCK,
  whitelist: ['1.0', '1.15', '1.5', '2.0', '2.5', '3.0']
});
Quill.register(LineHeightStyle, true);

// Register Margins (Top/Bottom)
const marginWhitelist = ['0px', '5px', '10px', '15px', '20px', '30px', '40px', '50px', '100px'];
const MarginTopStyle = new Parchment.Attributor.Style('margin-top', 'margin-top', {
    scope: Parchment.Scope.BLOCK,
    whitelist: marginWhitelist
});
const MarginBottomStyle = new Parchment.Attributor.Style('margin-bottom', 'margin-bottom', {
    scope: Parchment.Scope.BLOCK,
    whitelist: marginWhitelist
});
Quill.register(MarginTopStyle, true);
Quill.register(MarginBottomStyle, true);

const indentWhitelist = ['0cm', '1cm', '1.5cm', '2cm', '2.5cm', '3cm', '4cm'];
const TextIndentStyle = new Parchment.Attributor.Style('text-indent', 'text-indent', {
    scope: Parchment.Scope.BLOCK,
    whitelist: indentWhitelist
});
Quill.register(TextIndentStyle, true);

// Register Layout Styles (Width, Float, Border)
const WidthStyle = new Parchment.Attributor.Style('width', 'width', {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['1cm', '0.5cm', '2cm', '3cm', '5cm', '6cm', '19cm', '5%', '10%', '15%', '20%', '25%', '30%', '33.33%', '40%', '45%', '50%', '60%', '75%', '80%', '100%', 'auto']
});
const HeightStyle = new Parchment.Attributor.Style('height', 'height', {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['1px', '2px', '5px', '10px', '20px', '25px', '50px', '100px', 'auto']
});
const MarginLeftStyle = new Parchment.Attributor.Style('margin-left', 'margin-left', {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['auto', '0', '0px', '5px', '10px']
});
const MarginRightStyle = new Parchment.Attributor.Style('margin-right', 'margin-right', {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['auto', '0', '0px', '5px', '10px']
});

const FloatStyle = new Parchment.Attributor.Style('float', 'float', {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['left', 'right', 'none']
});

Quill.register(WidthStyle, true);
Quill.register(HeightStyle, true);
Quill.register(MarginLeftStyle, true);
Quill.register(MarginRightStyle, true);
Quill.register(FloatStyle, true);
const BorderTopStyle = new Parchment.Attributor.Style('border-top', 'border-top', {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['1px solid #000', '1px solid black', '1px solid', '1pt solid #000', '1pt solid black']
});
const BorderStyle = new Parchment.Attributor.Style('border', 'border', {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['1px solid #000', '1px solid black', '1px solid', '1pt solid #000', '1pt solid black']
});

Quill.register(WidthStyle, true);
Quill.register(FloatStyle, true);
Quill.register(BorderTopStyle, true);
Quill.register(BorderStyle, true);

// Register Letter Spacing
const letterSpacingWhitelist = ['-1px', '0px', '1px', '2px', '3px', '4px', '5px'];
const LetterSpacingStyle = new Parchment.Attributor.Style('letter-spacing', 'letter-spacing', {
    scope: Parchment.Scope.INLINE,
    whitelist: letterSpacingWhitelist
});
Quill.register(LetterSpacingStyle, true);

class VariableBlot extends Embed {
    static blotName = 'variable';
    static tagName = 'span';
    static className = 'masonic-variable-chip';

    static create(value: string) {
        let node = super.create();
        node.setAttribute('data-value', value);
        node.textContent = `{{ ${value} }}`;
        node.contentEditable = 'false';
        return node;
    }
    
    static value(node: any) {
        return node.getAttribute('data-value');
    }
}
Quill.register(VariableBlot);

interface RichTextVariableEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

const RichTextVariableEditor = React.forwardRef<ReactQuill, RichTextVariableEditorProps>(
  ({ value, onChange, readOnly, placeholder }, ref) => {
    
    const [viewSource, setViewSource] = useState(false);
    
    // Table Dialog State
    const [tableDialogOpen, setTableDialogOpen] = useState(false);
    const [tableConfig, setTableConfig] = useState({ rows: 2, cols: 2, border: true });

    // Handle Table Insertion Strategy (Float Grid)
    const handleInsertTable = () => {
        if (!ref || typeof ref === 'function') return; 
        const quill = (ref as any).current?.getEditor();
        if (!quill) return;

        const { rows, cols, border } = tableConfig;
        const width = `${Math.floor(100 / cols)}%`;
        const borderStyle = border ? 'border: 1px solid #000;' : '';
        const borderClass = border ? 'padding: 4px;' : 'padding: 4px;';

        let html = `<div style="width: 100%; overflow: hidden; margin-bottom: 10px;">`;
        
        for (let r = 0; r < rows; r++) {
            html += `<div style="width: 100%; overflow: hidden;">`;
            for (let c = 0; c < cols; c++) {
                 // Using simple blocks for cells
                html += `<div style="float: left; width: ${width}; ${borderStyle} ${borderClass} box-sizing: border-box; min-height: 24px;">
                            <p>Celulá</p>
                         </div>`;
            }
            html += `</div>`;
        }
        html += `<p style="clear: both;"><br/></p></div>`;

        const range = quill.getSelection();
        const index = range ? range.index : 0;
        quill.clipboard.dangerouslyPasteHTML(index, html);
        setTableDialogOpen(false);
    };

    const modules = useMemo(() => ({
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          [{ 'font': fontWhitelist }],
          [{ 'size': sizeWhitelist }],
          [{ 'line-height': LineHeightStyle.whitelist }],
          [{ 'letter-spacing': letterSpacingWhitelist }],
          [{ 'margin-top': marginWhitelist }, { 'margin-bottom': marginWhitelist }],
          [{ 'text-indent': indentWhitelist }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'align': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          [{ 'color': [] }, { 'background': [] }],
          ['insertTable'], // Custom Handler Button
          ['clean']
        ],
        handlers: {
            insertTable: () => {
                setTableDialogOpen(true);
            }
        }
      },
      clipboard: {
        matchVisual: false,
      },
      keyboard: {
        bindings: {
          tab: {
            key: 9,
            handler: function(this: any, _range: any, _context: any) {
              const range = this.quill.getSelection();
              if (range) {
                 this.quill.insertText(range.index, '\u00a0\u00a0\u00a0\u00a0');
                 this.quill.setSelection(range.index + 4);
              }
            }
          },
          'shift+tab': {
            key: 9,
            shiftKey: true,
            handler: function(this: any, _range: any, _context: any) {
              this.quill.format('indent', '-1');
            }
          }
        }
      }
    }), [tableConfig]); 

    const formats = [
      'header', 'font', 'size', 'line-height', 'letter-spacing', 'margin-top', 'margin-bottom', 'text-indent',
      'bold', 'italic', 'underline', 'strike',
      'align', 'list', 'bullet', 'indent',
      'color', 'background',
      'variable', 'width', 'float', 'border-top', 'border'
    ];

    return (
      <Paper elevation={2} sx={{ bgcolor: '#fff', position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
          <Tooltip title={viewSource ? "Ver Editor Visual" : "Ver Código Fonte"}>
            <IconButton 
              onClick={() => setViewSource(!viewSource)} 
              size="small" 
              sx={{ 
                bgcolor: '#fff', 
                border: '1px solid #e0e0e0',
                boxShadow: 1,
                '&:hover': { bgcolor: '#f5f5f5' } 
              }}
            >
              {viewSource ? <VisibilityIcon color="action" /> : <CodeIcon color="action" />}
            </IconButton>
          </Tooltip>
        </Box>

        {viewSource ? (
           <Box sx={{ p: 2, minHeight: '297mm', bgcolor: '#f5f5f5' }}>
              <TextField
                  multiline
                  fullWidth
                  variant="outlined"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Cole ou edite o código HTML aqui..."
                  InputProps={{
                      style: { fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#fff' }
                  }}
                  sx={{ 
                      '& .MuiInputBase-root': { alignItems: 'flex-start', minHeight: '297mm' }
                  }}
              />
           </Box>
        ) : (
            <Box 
              className="document-editor-container"
              sx={{
                '& .masonic-variable-chip': {
                    display: 'inline-block',
                    padding: '2px 8px',
                    backgroundColor: '#e3f2fd',
                    color: '#1565c0',
                    borderRadius: '16px',
                    border: '1px solid #90caf9',
                    fontSize: '0.85em',
                    fontWeight: 'bold',
                    fontFamily: 'sans-serif',
                    margin: '0 2px',
                    userSelect: 'none',
                    verticalAlign: 'middle',
                    cursor: 'pointer',
                },
                '& .ql-toolbar': {
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px 4px 0 0',
                    mr: 5
                },
                '& .ql-insertTable': {
                    width: 'auto !important',
                    fontWeight: 'bold',
                    color: '#444'
                },
                '& .ql-insertTable::before': {
                    content: '"Tabela"',
                    fontSize: '13px'
                }, 
                '& .ql-stroke': {
                    stroke: '#333 !important',
                },
                '& .ql-fill': {
                    fill: '#333 !important',
                },
                '& .ql-picker': {
                    color: '#333 !important',
                },
                '& .ql-container': {
                    minHeight: '297mm', 
                    fontSize: '12pt',
                    fontFamily: 'Times New Roman, serif',
                    color: '#000000',
                    backgroundColor: '#ffffff',
                },
                '& .ql-editor': {
                    padding: '2.5cm 2cm 2cm 2.5cm',
                    minHeight: '297mm',
                    boxSizing: 'border-box'
                }
              }}
            >
              <ReactQuill
                ref={ref}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                readOnly={readOnly}
                preserveWhitespace
                placeholder={placeholder}
              />
              
              <Dialog open={tableDialogOpen} onClose={() => setTableDialogOpen(false)}>
                <DialogTitle>Inserir Tabela</DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 300 }}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField 
                                label="Linhas" 
                                type="number" 
                                value={tableConfig.rows} 
                                onChange={(e) => setTableConfig({...tableConfig, rows: parseInt(e.target.value) || 1})}
                                fullWidth
                                inputProps={{ min: 1, max: 20 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField 
                                label="Colunas" 
                                type="number" 
                                value={tableConfig.cols} 
                                onChange={(e) => setTableConfig({...tableConfig, cols: parseInt(e.target.value) || 1})}
                                fullWidth
                                inputProps={{ min: 1, max: 4 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={<Switch checked={tableConfig.border} onChange={(e) => setTableConfig({...tableConfig, border: e.target.checked})} />}
                                label="Mostrar Bordas (1px Preta)"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTableDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleInsertTable} variant="contained" color="primary">Inserir</Button>
                </DialogActions>
              </Dialog>

            </Box>
        )}
      </Paper>
    );
  }
);

RichTextVariableEditor.displayName = 'RichTextVariableEditor';

export default RichTextVariableEditor;
