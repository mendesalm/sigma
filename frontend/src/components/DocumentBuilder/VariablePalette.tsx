import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../../services/api';

interface Variable {
  key: string;
  label: string;
  type?: string;
  description?: string;
  example?: string;
}

interface VariableGroup {
  id: string;
  label: string;
  variables: Variable[];
}

interface VariablesResponse {
  groups: VariableGroup[];
}

interface VariablePaletteProps {
  documentType: string;
  onInsertVariable: (variableKey: string) => void;
}

const VariablePalette: React.FC<VariablePaletteProps> = ({ documentType, onInsertVariable }) => {
  const [groups, setGroups] = useState<VariableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVariables = async () => {
      try {
        setLoading(true);
        // Using the new endpoint created in backend
        const response = await api.get<VariablesResponse>(`/documents/variables/${documentType}`);
        setGroups(response.data.groups);
      } catch (err) {
        console.error("Failed to load variables", err);
        setError("Erro ao carregar variáveis.");
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, [documentType]);

  const handleDragStart = (e: React.DragEvent, variable: Variable) => {
    // Texto puro como fallback
    e.dataTransfer.setData("text/plain", `{{ ${variable.key} }}`);
    
    // HTML formatado para o Quill reconhecer como nosso Blot 'variable'
    // O Quill usa class e data attributes para matching
    const html = `<span class="masonic-variable-chip" data-value="${variable.key}">{{ ${variable.key} }}</span>`;
    e.dataTransfer.setData("text/html", html);
    
    e.dataTransfer.effectAllowed = "copy";
  };

  if (loading) return <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>;
  if (error) return <Typography color="error" variant="caption">{error}</Typography>;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: '100%', 
        height: '100%', 
        overflowY: 'auto', 
        bgcolor: 'background.paper',
        borderLeft: 1,
        borderColor: 'divider'
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="subtitle1" fontWeight="bold" color="primary">
          Variáveis Disponíveis
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Clique para inserir ou arraste para o editor.
        </Typography>
      </Box>

      {groups.map((group) => (
        <Accordion key={group.id} defaultExpanded={group.id === 'info' || group.id === 'officers_legacy'} disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, borderBottom: 1, borderColor: 'divider' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover', minHeight: 48 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {group.label}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {group.variables.map((v) => (
                <Tooltip key={v.key} title={v.description || v.example || v.label} arrow placement="left">
                    <Chip 
                        label={v.label} 
                        onClick={() => onInsertVariable(v.key)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, v)}
                        size="small"
                        variant="outlined"
                        sx={{ 
                            cursor: 'grab', 
                            fontSize: '0.75rem',
                            maxWidth: '100%',
                            '&:hover': { bgcolor: 'action.selected', borderColor: 'primary.main' }
                        }} 
                    />
                </Tooltip>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
};

export default VariablePalette;
