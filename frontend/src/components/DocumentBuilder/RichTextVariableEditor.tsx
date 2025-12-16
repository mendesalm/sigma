import React, { useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Box, Paper } from '@mui/material';

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
  'trebuchet-ms'
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
}

const RichTextVariableEditor = React.forwardRef<ReactQuill, RichTextVariableEditorProps>(
  ({ value, onChange, readOnly }, ref) => {
    
    const modules = useMemo(() => ({
      toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': fontWhitelist }],
        [{ 'size': sizeWhitelist }],
        [{ 'line-height': LineHeightStyle.whitelist }],
        [{ 'margin-top': marginWhitelist }, { 'margin-bottom': marginWhitelist }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'align': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
      ],
      clipboard: {
        matchVisual: false,
      }
    }), []);

    const formats = [
      'header', 'font', 'size', 'line-height', 'margin-top', 'margin-bottom',
      'bold', 'italic', 'underline', 'strike',
      'align', 'list', 'bullet', 'indent',
      'color', 'background',
      'variable' 
    ];

    return (
      <Paper elevation={2} sx={{ bgcolor: '#fff' }}>
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
                minHeight: '297mm', // A4 height approx
                fontSize: '12pt',
                fontFamily: 'Times New Roman, serif',
                color: '#000000',
                backgroundColor: '#ffffff',
            },
            '& .ql-editor': {
                padding: '2.5cm 2cm 2cm 2.5cm', // A4 Margins
                minHeight: '297mm',
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
          />
        </Box>
      </Paper>
    );
  }
);

RichTextVariableEditor.displayName = 'RichTextVariableEditor';

export default RichTextVariableEditor;
