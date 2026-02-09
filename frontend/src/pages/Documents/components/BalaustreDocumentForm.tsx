import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Grid, 
  InputAdornment, 
  Paper, 
  Alert,
  Divider,
  Stack,
  Autocomplete,
  useTheme,
  Chip
} from '@mui/material';
import { 
  Person as PersonIcon, 
  AccessTime as AccessTimeIcon, 
  Event as EventIcon, 
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

interface BalaustreDocumentFormProps {
  formData: any;
  onChange: (data: any) => void;
  readOnly?: boolean;
  members: any[]; 
}

const OfficerInput = ({ value, onChange, members, readOnly, label, icon }: any) => {
    
    if (readOnly) {
        return (
            <TextField
                fullWidth
                label={label}
                value={value || ''}
                InputProps={{
                    readOnly: true,
                    startAdornment: icon ? <InputAdornment position="start">{icon}</InputAdornment> : null,
                }}
                variant="outlined"
                size="small"
            />
        );
    }

    return (
        <Autocomplete
            freeSolo
            options={members.map((m: any) => m.full_name)}
            value={value || ''}
            onChange={(_, newValue) => onChange(newValue)}
            onInputChange={(_, newInputValue) => onChange(newInputValue)}
            renderInput={(params) => (
                <TextField 
                    {...params} 
                    label={label}
                    variant="outlined"
                    fullWidth 
                    size="small"
                    InputProps={{ 
                        ...params.InputProps,
                        startAdornment: icon ? <InputAdornment position="start">{icon}</InputAdornment> : null,
                    }}
                    placeholder="Selecione ou digite..."
                />
            )}
        />
    );
};

const SectionHeader = ({ title, icon }: { title: string, icon?: React.ReactNode }) => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 3 }}>
            {icon && <Box sx={{ mr: 1, color: theme.palette.primary.main }}>{icon}</Box>}
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                {title}
            </Typography>
            <Divider sx={{ flexGrow: 1, ml: 2, borderColor: theme.palette.divider }} />
        </Box>
    );
};

const BalaustreDocumentForm: React.FC<BalaustreDocumentFormProps> = ({ formData, onChange, readOnly = false, members = [] }) => {
  const theme = useTheme(); // Correctly placed inside the component

  const handleChange = (field: string, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {!readOnly && (
            <Box sx={{ 
                mb: 3, 
                p: 2, 
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: 1
            }}>
                 <Typography variant="subtitle1" fontWeight="bold">Editor de Dados do Balaústre</Typography>
                 <Typography variant="caption" color="text.secondary">
                    Preencha os campos abaixo para alimentar o modelo. Ao clicar em aplicar, o texto será regenerado.
                 </Typography>
            </Box>
        )}

        <Stack spacing={3}>
            {/* Cabeçalho da Loja */}

                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', fontFamily: 'serif' }}>
                                {formData.lodge_name || 'Loja Maçônica'}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                <Chip label={`Nº ${formData.lodge_number || '00'}`} size="small" color="primary" variant="outlined" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    {formData.lodge_city || 'Oriente'}
                                </Typography>
                            </Stack>
                        </Box>
                        {!readOnly && (
                             <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                 * Dados carregados automaticamente da sessão
                             </Typography>
                        )}
                    </Stack>
                </Paper>

                {/* Composição da Loja */}
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <SectionHeader title="Composição da Loja (Oficiais)" icon={<PersonIcon />} />
                    
                    <Alert severity="info" icon={false} sx={{ mb: 3, bgcolor: theme.palette.action.hover }}>
                        <Typography variant="caption">
                            Os cargos foram pré-preenchidos com base nos titulares e presenças. Altere apenas se houve substituição 'ad hoc' nesta sessão.
                        </Typography>
                    </Alert>

                    <Grid container spacing={2}>
                        {[
                            { label: 'Venerável Mestre', field: 'Veneravel' },
                            { label: '1° Vigilante', field: 'PrimeiroVigilante' },
                            { label: '2° Vigilante', field: 'SegundoVigilante' },
                            { label: 'Orador', field: 'Orador' },
                            { label: 'Secretário', field: 'Secretario' },
                            { label: 'Tesoureiro', field: 'Tesoureiro' },
                            { label: 'Chanceler', field: 'Chanceler' },
                             { label: 'Hospitaleiro', field: 'Hospitaleiro' }
                        ].map(({ label, field }) => (
                            <Grid item xs={12} sm={6} md={3} key={field}>
                                <OfficerInput 
                                    label={label}
                                    value={formData[field]} 
                                    onChange={(val: any) => handleChange(field, val)} 
                                    members={members} 
                                    readOnly={readOnly}
                                    icon={<PersonIcon fontSize="small" sx={{ color: 'action.active' }} />}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                {/* Desenvolvimento do Balaústre */}
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <SectionHeader title="Desenvolvimento dos Trabalhos" icon={<DescriptionIcon />} />
                    
                    <Stack spacing={3}>
                        <TextField
                            label="Balaústre da Sessão Anterior"
                            multiline
                            minRows={2}
                            value={formData.BalaustreAnterior || ''}
                            onChange={(e) => handleChange('BalaustreAnterior', e.target.value)}
                            placeholder="Ex: Lido e aprovado sem emendas..."
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                        />

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Expediente Recebido"
                                    multiline
                                    minRows={3}
                                    value={formData.ExpedienteRecebido || ''}
                                    onChange={(e) => handleChange('ExpedienteRecebido', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Expediente Expedido"
                                    multiline
                                    minRows={3}
                                    value={formData.ExpedienteExpedido || ''}
                                    onChange={(e) => handleChange('ExpedienteExpedido', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            label="Saco de Propostas e Informações"
                            multiline
                            minRows={2}
                            value={formData.SacoProposta || ''}
                            onChange={(e) => handleChange('SacoProposta', e.target.value)}
                            placeholder="Descreva o conteúdo do saco de propostas..."
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Ordem do Dia"
                            multiline
                            minRows={3}
                            value={formData.OrdemDia || ''}
                            onChange={(e) => handleChange('OrdemDia', e.target.value)}
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                        />
                         
                        <Grid container spacing={3}>
                             <Grid item xs={12} md={6}>
                                <TextField
                                    label="Escrutínio Secreto"
                                    multiline
                                    minRows={2}
                                    value={formData.Escrutinio || ''}
                                    onChange={(e) => handleChange('Escrutinio', e.target.value)}
                                    placeholder="Não houve..."
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                             </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Tempo de Instrução"
                                    multiline
                                    minRows={2}
                                    value={formData.TempoInstrucao || ''}
                                    onChange={(e) => handleChange('TempoInstrucao', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MoneyIcon fontSize="small" color="primary" /> Tronco de Beneficência
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Valor Arrecadado"
                                        value={formData.ValorTronco || ''}
                                        onChange={(e) => handleChange('ValorTronco', e.target.value)}
                                        fullWidth
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <TextField
                                        label="Descrição do Giro"
                                        multiline
                                        minRows={2}
                                        value={formData.Tronco || ''}
                                        onChange={(e) => handleChange('Tronco', e.target.value)}
                                        placeholder="Fez seu giro habitual..."
                                        fullWidth
                                        variant="outlined"
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <TextField
                            label="Palavra a Bem da Ordem"
                            multiline
                            minRows={4}
                            value={formData.Palavra || ''}
                            onChange={(e) => handleChange('Palavra', e.target.value)}
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                        />
                        
                         <TextField
                            label="Emendas"
                            multiline
                            minRows={2}
                            value={formData.Emendas || ''}
                            onChange={(e) => handleChange('Emendas', e.target.value)}
                            placeholder="Emendas adicionais..."
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </Paper>

                {/* Encerramento e Assinaturas */}
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                     <SectionHeader title="Encerramento" icon={<AccessTimeIcon />} />
                     
                     <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                type="time"
                                label="Horário de Encerramento"
                                value={formData.HoraEncerramento || ''}
                                onChange={(e) => handleChange('HoraEncerramento', e.target.value)}
                                fullWidth
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={8}>
                             <TextField
                                label="Data da Assinatura (Extenso)"
                                value={formData.DataAssinatura || ''}
                                onChange={(e) => handleChange('DataAssinatura', e.target.value)}
                                fullWidth
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><EventIcon fontSize="small" /></InputAdornment>
                                }}
                            />
                        </Grid>
                     </Grid>

                     <Divider sx={{ my: 4 }} />

                     <Typography variant="subtitle2" align="center" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
                        Responsáveis pela Assinatura
                     </Typography>

                     <Grid container spacing={3}>
                        {[
                            { label: 'Secretário', field: 'SecretarioNome' },
                            { label: 'Orador', field: 'OradorNome' },
                            { label: 'Venerável Mestre', field: 'VeneravelNome' }
                        ].map(({ label, field }) => (
                            <Grid item xs={12} md={4} key={field}>
                                <TextField
                                    label={label}
                                    value={formData[field] || ''}
                                    onChange={(e) => handleChange(field, e.target.value)}
                                    fullWidth
                                    variant="filled"
                                    size="small"
                                />
                            </Grid>
                        ))}
                     </Grid>
                </Paper>
            </Stack>

    </Box>
  );
};

export default BalaustreDocumentForm;
