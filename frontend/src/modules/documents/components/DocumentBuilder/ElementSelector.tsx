import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Box, Paper, Typography, Switch } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export interface StructuralElement {
    key: string;
    enabled: boolean;
    order: number;
}

interface ElementSelectorProps {
    elements: StructuralElement[];
    onChange: (newElements: StructuralElement[]) => void;
}

const elementLabels: Record<string, string> = {
    'cabecalho_pagina': 'Cabeçalho da Página',
    'titulos': 'Títulos',
    'identificacao': 'Identificação do Documento',
    'enderecamento': 'Endereçamento',
    'assunto': 'Pauta / Assunto',
    'texto': 'Corpo do Texto principal',
    'local_data': 'Data e Local',
    'assinatura': 'Assinaturas',
    'rodape_pagina': 'Rodapé da Página'
};

const ElementSelector: React.FC<ElementSelectorProps> = ({ elements, onChange }) => {
    // Sort elements visually by order
    const sortedElements = [...elements].sort((a, b) => a.order - b.order);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(sortedElements);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update the order property of each item based on new index
        const newElements = items.map((item, index) => ({
            ...item,
            order: index
        }));

        onChange(newElements);
    };

    const toggleEnabled = (key: string) => {
        const newElements = elements.map(item => 
            item.key === key ? { ...item, enabled: !item.enabled } : item
        );
        onChange(newElements);
    };

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Arraste para reordenar a sequência no documento. Desligue os elementos que não deseja incluir.
            </Typography>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="elements-list">
                    {(provided) => (
                        <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {sortedElements.map((item, index) => (
                                <Draggable key={item.key} draggableId={item.key} index={index}>
                                    {(provided, snapshot) => (
                                        <Paper
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            elevation={snapshot.isDragging ? 4 : 1}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 1.5,
                                                bgcolor: snapshot.isDragging ? '#f1f5f9' : 'background.paper',
                                                border: '1px solid',
                                                borderColor: snapshot.isDragging ? 'primary.main' : '#e2e8f0',
                                                opacity: item.enabled ? 1 : 0.6,
                                                transition: 'background-color 0.2s ease',
                                                gap: 2
                                            }}
                                        >
                                            <Box {...provided.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', color: 'action.active', cursor: 'grab' }}>
                                                <DragIndicatorIcon />
                                            </Box>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="body1" sx={{ fontWeight: item.enabled ? 'bold' : 'normal', color: item.enabled ? 'text.primary' : 'text.disabled' }}>
                                                    {elementLabels[item.key] || item.key}
                                                </Typography>
                                            </Box>
                                            <Switch
                                                checked={item.enabled}
                                                onChange={() => toggleEnabled(item.key)}
                                                color="primary"
                                                size="small"
                                            />
                                        </Paper>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </Box>
                    )}
                </Droppable>
            </DragDropContext>
        </Box>
    );
};

export default ElementSelector;
