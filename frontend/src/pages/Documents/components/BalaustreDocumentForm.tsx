import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Grid,
  InputAdornment,
  Paper
} from '@mui/material';

import { Autocomplete } from '@mui/material';

const InlineInput = ({ width, textAlign, ...props }: any) => (
  <input 
    style={{ 
      border: 'none', 
      borderBottom: '1px solid #333', 
      padding: '0 4px', 
      outline: 'none',
      width: width || 'auto',
      fontWeight: 'bold',
      backgroundColor: 'transparent',
      textAlign: textAlign || 'center',
      fontSize: 'inherit',
      fontFamily: 'inherit'
    }} 
    {...props} 
  />
);

const BlockInput = ({ ...props }: any) => (
  <TextField
    fullWidth
    multiline
    variant="standard"
    InputProps={{ disableUnderline: true }}
    sx={{ 
      bgcolor: '#fff', 
      p: 1.5, 
      borderRadius: 1, 
      border: '1px solid #e0e0e0',
      mt: 1,
      mb: 2,
      '& .MuiInputBase-input': { fontSize: '0.95rem' }
    }}
    {...props}
  />
);

const SectionTitle = ({ children }: any) => (
  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 0.5, textTransform: 'uppercase', color: '#444' }}>
    {children}
  </Typography>
);

interface BalaustreDocumentFormProps {
  formData: any;
  onChange: (data: any) => void;
  readOnly?: boolean;
  members: any[]; // List of available members
}

const OfficerInput = ({ value, onChange, members, readOnly, placeholder }: any) => {
    if (readOnly) {
        return <InlineInput fullWidth width="100%" textAlign="left" value={value} readOnly={true} />;
    }
    return (
        <Autocomplete
            freeSolo
            options={members.map((m: any) => m.full_name)}
            value={value || ''}
            onChange={(event, newValue) => onChange(newValue)}
            onInputChange={(event, newInputValue) => onChange(newInputValue)}
            renderInput={(params) => (
                <TextField 
                    {...params} 
                    variant="standard" 
                    fullWidth 
                    placeholder={placeholder || "Nome do Irmão"}
                    InputProps={{ ...params.InputProps, disableUnderline: true }}
                    sx={{ bgcolor: '#f5f5f5', px: 1, borderRadius: 1 }}
                />
            )}
        />
    );
};

// ... (Document component start)

const BalaustreDocumentForm: React.FC<BalaustreDocumentFormProps> = ({ formData, onChange, readOnly = false, members = [] }) => {
  
  const handleChange = (field: string, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <Paper elevation={2} sx={{ p: 5, maxWidth: '210mm', mx: 'auto', bgcolor: '#fff', color: '#000' }}>
      <Box sx={{ textAlign: 'center', mb: 5, borderBottom: '1px solid #eee', pb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', textTransform: 'uppercase', mb: 1, fontFamily: 'serif' }}>
            {formData.lodge_name || 'Loja Maçônica'}
        </Typography>
        <Typography variant="subtitle1" sx={{ letterSpacing: 2 }}>
            Nº {formData.lodge_number || '00'}
        </Typography>
      </Box>
      <Box sx={{ mt: 3, mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px dashed #ccc' }}>
        <Typography variant="caption" sx={{ display:'block', mb: 1, color: '#666' }}>
            * Titulares preenchidos automaticamente. Edite para substituir por outro membro nesta sessão.
        </Typography>
        <Grid container spacing={1} alignItems="center">
            {[
                { label: 'Venerável Mestre:', field: 'Veneravel' },
                { label: '1° Vigilante:', field: 'PrimeiroVigilante' },
                { label: '2° Vigilante:', field: 'SegundoVigilante' },
                { label: 'Orador:', field: 'Orador' },
                { label: 'Secretário:', field: 'Secretario' },
                { label: 'Chanceler:', field: 'Chanceler' },
                { label: 'Tesoureiro:', field: 'Tesoureiro' },
                { label: 'Hospitaleiro:', field: 'Hospitaleiro' }
            ].map(({ label, field }) => (
                <Grid item xs={12} key={field}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 'bold', minWidth: 150, whiteSpace: 'nowrap', color: '#333' }}>{label}</Typography>
                        <OfficerInput 
                            value={formData[field]} 
                            onChange={(val: any) => handleChange(field, val)} 
                            members={members} 
                            readOnly={readOnly} 
                        />
                    </Box>
                </Grid>
            ))}
        </Grid>
      </Box>

      <SectionTitle>Balaústre:</SectionTitle>
      <BlockInput
        minRows={2}
        value={formData.BalaustreAnterior || ''}
        onChange={(e: any) => handleChange('BalaustreAnterior', e.target.value)}
        placeholder="Lido e aprovado o Balaústre da Sessão do dia..."
        readOnly={readOnly}
      />

      <SectionTitle>Expediente Recebido:</SectionTitle>
      <BlockInput
        minRows={3}
        value={formData.ExpedienteRecebido || ''}
        onChange={(e: any) => handleChange('ExpedienteRecebido', e.target.value)}
        placeholder="Descreva o expediente recebido..."
        readOnly={readOnly}
      />

      <SectionTitle>Expediente Expedido:</SectionTitle>
      <BlockInput
        minRows={3}
        value={formData.ExpedienteExpedido || ''}
        onChange={(e: any) => handleChange('ExpedienteExpedido', e.target.value)}
        placeholder="Descreva o expediente expedido..."
        readOnly={readOnly}
      />

      <SectionTitle>Saco de Propostas e Informações:</SectionTitle>
      <BlockInput
        minRows={3}
        value={formData.SacoProposta || ''}
        onChange={(e: any) => handleChange('SacoProposta', e.target.value)}
        placeholder="Colheu-se..."
        readOnly={readOnly}
      />

      <SectionTitle>Ordem do Dia:</SectionTitle>
      <BlockInput
        minRows={3}
        value={formData.OrdemDia || ''}
        onChange={(e: any) => handleChange('OrdemDia', e.target.value)}
        placeholder="Tratou-se de..."
        readOnly={readOnly}
      />

      <SectionTitle>Escrutínio Secreto:</SectionTitle>
      <BlockInput
        minRows={2}
        value={formData.Escrutinio || ''}
        onChange={(e: any) => handleChange('Escrutinio', e.target.value)}
        placeholder="Não houve..."
        readOnly={readOnly}
      />

      <SectionTitle>Tempo de Instrução:</SectionTitle>
      <BlockInput
        minRows={2}
        value={formData.TempoInstrucao || ''}
        onChange={(e: any) => handleChange('TempoInstrucao', e.target.value)}
        placeholder="Preenchido pelo..."
        readOnly={readOnly}
      />

      <SectionTitle>Tronco de Beneficência:</SectionTitle>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography>
            Fez o seu giro habitual pelo ir∴ Hospitaleiro, sendo entregue o seu produto ao ir∴ Tesoureiro para conferência e, no momento oportuno, foi anunciada a medalha cunhada de:
        </Typography>
        <TextField
            variant="standard"
            value={formData.Tronco || ''}
            onChange={(e) => handleChange('Tronco', e.target.value)}
            disabled={readOnly}
            InputProps={{
                startAdornment: <InputAdornment position="start"><Typography sx={{ color: '#000', fontWeight: 'bold' }}>R$</Typography></InputAdornment>,
                disableUnderline: true,
                style: { color: '#000', fontWeight: 'bold', fontSize: '1.1em' }
            }}
            sx={{ 
                width: 150, 
                bgcolor: '#f5f5f5', 
                borderRadius: 1, 
                px: 1,
                borderBottom: '1px solid #999'
            }}
        />
      </Box>

      <SectionTitle>Palavra a Bem da Ordem em Geral e do Quadro em Particular:</SectionTitle>
      <BlockInput
        minRows={4}
        value={formData.Palavra || ''}
        onChange={(e: any) => handleChange('Palavra', e.target.value)}
        placeholder="Concedida a palavra..."
        readOnly={readOnly}
      />

      <Box sx={{ mt: 4, textAlign: 'justify', borderTop: '1px solid #eee', pt: 2 }}>
        <b>Encerramento:</b> o Ven∴ Mestre encerrou a sessão às 
        <InlineInput 
          type="time" 
          value={formData.HoraEncerramento || ''} 
          onChange={(e: any) => handleChange('HoraEncerramento', e.target.value)}
          width="110px"
          readOnly={readOnly}
        />
        , tendo eu, Secretário, lavrado o presente balaústre, que depois de lido, se achado em tudo conforme, será assinado.
      </Box>

      <SectionTitle>Emendas:</SectionTitle>
      <BlockInput
        minRows={2}
        value={formData.Emendas || ''}
        onChange={(e: any) => handleChange('Emendas', e.target.value)}
        placeholder="Emendas adicionais..."
        readOnly={readOnly}
      />

      <Box sx={{ mt: 4, textAlign: 'right' }}>
        Oriente de <b>{formData.lodge_city || '[CIDADE]'}</b>, 
        <InlineInput 
          type="text" 
          value={formData.DataAssinatura || ''} 
          onChange={(e: any) => handleChange('DataAssinatura', e.target.value)}
          width="200px"
          readOnly={readOnly}
        />
        – E∴ V∴
      </Box>

      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between', textAlign: 'center', gap: 2 }}>
        <Box sx={{ width: '30%' }}>
            <Typography variant="caption" display="block" sx={{ mb: 4, color: '#666' }}>Assinatura do Secretário</Typography>
            <InlineInput fullWidth width="100%" placeholder="Nome do Secretário" value={formData.SecretarioNome || ''} onChange={(e: any) => handleChange('SecretarioNome', e.target.value)} readOnly={readOnly} />
        </Box>
        <Box sx={{ width: '30%' }}>
            <Typography variant="caption" display="block" sx={{ mb: 4, color: '#666' }}>Assinatura do Orador</Typography>
            <InlineInput fullWidth width="100%" placeholder="Nome do Orador" value={formData.OradorNome || ''} onChange={(e: any) => handleChange('OradorNome', e.target.value)} readOnly={readOnly} />
        </Box>
        <Box sx={{ width: '30%' }}>
            <Typography variant="caption" display="block" sx={{ mb: 4, color: '#666' }}>Assinatura do Ven∴ Mestre</Typography>
            <InlineInput fullWidth width="100%" placeholder="Nome do Ven∴ Mestre" value={formData.VeneravelNome || ''} onChange={(e: any) => handleChange('VeneravelNome', e.target.value)} readOnly={readOnly} />
        </Box>
      </Box>

    </Paper>
  );
};

export default BalaustreDocumentForm;
