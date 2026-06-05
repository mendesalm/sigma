import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';
import { Box, Paper, IconButton, Tooltip, TextField } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';

// 1. Define the custom extension for Variable Badges
const VariableBadgeExtension = Node.create({
    name: 'variableBadge',
    group: 'inline',
    inline: true,
    atom: true, // This makes it act as a single unit (non-editable internally)

    addAttributes() {
        return {
            variable: {
                default: null,
            },
            label: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span.sigma-variable-badge',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { class: 'sigma-variable-badge' }), `[ ${HTMLAttributes.label} ]`];
    },

    addNodeView() {
        return ReactNodeViewRenderer((props) => {
            return (
                <NodeViewWrapper as="span" style={{
                    display: 'inline-block',
                    backgroundColor: '#e2e8f0',
                    color: '#0f172a',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    margin: '0 4px',
                    fontSize: '0.9em',
                    fontWeight: 'bold',
                    userSelect: 'none',
                    verticalAlign: 'baseline',
                    border: '1px solid #cbd5e1'
                }}>
                    [ {props.node.attrs.label} ]
                </NodeViewWrapper>
            );
        });
    },
});

export interface TiptapEditorProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
}

export interface TiptapEditorRef {
    insertVariable: (variable: string, label: string) => void;
}

const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(({ value, onChange, readOnly = false }, ref) => {
    const [htmlMode, setHtmlMode] = useState(false);
    const [rawHtml, setRawHtml] = useState(value);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Comece a digitar o documento aqui...',
            }),
            VariableBadgeExtension,
        ],
        content: value,
        editable: !readOnly && !htmlMode,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setRawHtml(html);
            onChange(html);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
            },
            handleDrop: (view, event, _slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.types.includes('application/x-sigma-variable')) {
                    const variableData = event.dataTransfer.getData('application/x-sigma-variable');
                    try {
                        const data = JSON.parse(variableData);
                        const { state } = view;
                        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

                        if (coordinates) {
                            const node = state.schema.nodes.variableBadge.create({
                                variable: data.variable,
                                label: data.label,
                            });
                            const transaction = state.tr.insert(coordinates.pos, node);
                            view.dispatch(transaction);
                            return true; // We handled the drop
                        }
                    } catch (e) {
                        console.error('Failed to parse dropped variable', e);
                    }
                }
                return false;
            }
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML() && !htmlMode) {
            editor.commands.setContent(value);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRawHtml(value);
        }
    }, [value, editor, htmlMode]);

    useImperativeHandle(ref, () => ({
        insertVariable: (variable: string, label: string) => {
            if (editor) {
                editor.chain().focus().insertContent({
                    type: 'variableBadge',
                    attrs: { variable, label }
                }).insertContent(' ').run();
            }
        }
    }));

    const toggleHtmlMode = () => {
        if (htmlMode && editor) {
            editor.commands.setContent(rawHtml);
            onChange(rawHtml);
        }
        setHtmlMode(!htmlMode);
    };

    const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRawHtml(e.target.value);
        onChange(e.target.value);
    };

    if (!editor) {
        return null;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Editor Toolbar */}
            {!readOnly && (
                <Box sx={{
                    display: 'flex',
                    gap: 1,
                    p: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    alignItems: 'center'
                }}>
                    <Tooltip title="Negrito">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            disabled={htmlMode}
                            color={editor.isActive('bold') ? 'primary' : 'default'}
                        >
                            <FormatBoldIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Itálico">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            disabled={htmlMode}
                            color={editor.isActive('italic') ? 'primary' : 'default'}
                        >
                            <FormatItalicIcon />
                        </IconButton>
                    </Tooltip>

                    <Box sx={{ flexGrow: 1 }} />

                    <Tooltip title={htmlMode ? "Modo Visual" : "Modo Código HTML"}>
                        <IconButton size="small" onClick={toggleHtmlMode} color={htmlMode ? "primary" : "default"}>
                            {htmlMode ? <VisibilityIcon /> : <CodeIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Editor Content Area */}
            <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'auto', p: 2 }}>
                {htmlMode ? (
                    <TextField
                        fullWidth
                        multiline
                        minRows={15}
                        value={rawHtml}
                        onChange={handleRawHtmlChange}
                        disabled={readOnly}
                        InputProps={{
                            sx: { fontFamily: 'monospace', fontSize: '14px' }
                        }}
                    />
                ) : (
                    <Paper elevation={0} sx={{ minHeight: '300px', p: 2, border: 1, borderColor: 'divider' }}>
                        <EditorContent editor={editor} />
                    </Paper>
                )}
            </Box>
        </Box>
    );
});

TiptapEditor.displayName = 'TiptapEditor';

export default TiptapEditor;
