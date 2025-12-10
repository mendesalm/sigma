import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Grid,
  InputAdornment,
  Paper
} from '@mui/material';

interface BalaustreDocumentFormProps {
  formData: any;
  onChange: (data: any) => void;
  readOnly?: boolean;
}

const InlineInput = ({ width = '100px', readOnly = false, textAlign = 'center', value, ...props }: any) => {
  // Calcula largura dinâmica: ~11px por caractere (Times New Roman 12pt) + 24px de padding/margem
  // Se tiver valor, usa o cálculo. Se não, usa o width original (placeholder).
  const calculatedWidth = value && String(value).length > 0 
    ? `${Math.max(String(value).length * 11, 40) + 24}px` 
    : width;

  return (
    <TextField
      variant="standard"
      size="small"
      disabled={readOnly}
      value={value}
      InputProps={{
          disableUnderline: true,
          style: { 
              color: '#000', 
              fontWeight: 'bold', 
              fontSize: 'inherit',
              fontFamily: 'inherit'
          }
      }}
      sx={{ 
        width: calculatedWidth,
        // Removemos minWidth rígido para permitir que encolha ao tamanho do texto
        minWidth: value ? '40px' : width,
        maxWidth: '100%',
        display: 'inline-flex', 
        mx: 0.5,
        bgcolor: '#f5f5f5', 
        borderRadius: 1,
        borderBottom: '1px solid #999',
        transition: 'background-color 0.2s, width 0.2s',
        '&:hover': {
          bgcolor: '#e0e0e0',
        },
        '& .MuiInput-input': { 
          padding: '2px 8px',
          textAlign: textAlign,
          cursor: readOnly ? 'default' : 'text',
          textOverflow: 'ellipsis'
        }
      }}
      {...props}
    />
  );
};

const BlockInput = ({ readOnly = false, ...props }: any) => (
    <TextField
        fullWidth
        multiline
        variant="outlined"
        disabled={readOnly}
        InputProps={{
            style: { 
                color: '#000', 
                fontFamily: 'inherit',
                fontSize: '11pt',
                lineHeight: 1.5,
                backgroundColor: '#f5f5f5'
            }
        }}
        sx={{
            mt: 1,
            '& .MuiOutlinedInput-root': {
                '& fieldset': {
                    borderColor: '#ccc',
                },
                '&:hover fieldset': {
                    borderColor: '#999',
                },
                '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                    borderWidth: '2px'
                },
            }
        }}
        {...props}
    />
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 3, mb: 0.5, color: '#000', borderBottom: '1px solid #eee', pb: 0.5 }}>
    {children}
  </Typography>
);

const BalaustreDocumentForm: React.FC<BalaustreDocumentFormProps> = ({ formData, onChange, readOnly = false }) => {
  
  const handleChange = (field: string, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <Paper elevation={3} sx={{ 
      fontFamily: '"Times New Roman", Times, serif', 
      fontSize: '12pt',
      lineHeight: 1.8,
      p: 5,
      bgcolor: '#ffffff',
      color: '#000000',
      border: '1px solid #e0e0e0',
      maxWidth: '210mm',
      mx: 'auto'
    }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px double #000', pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#000', mb: 0.5 }}>
          À GL∴ DO SUPR∴ ARQ∴ DO UNIV∴
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#000', mb: 0.5 }}>
          A∴R∴B∴L∴S {formData.lodge_name || '[NOME DA LOJA]'} Nº {formData.lodge_number || '[NUMERO]'}
        </Typography>
        
        <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>
          BALAÚSTRE DA 
          <InlineInput 
            value={formData.NumeroAta || ''} 
            onChange={(e: any) => handleChange('NumeroAta', e.target.value)}
            width="80px"
            readOnly={readOnly}
          />
          ª SESSÃO DO E∴ M∴ 
          <InlineInput 
            value={formData.ExercicioMaconico || ''} 
            onChange={(e: any) => handleChange('ExercicioMaconico', e.target.value)}
            width="120px"
            placeholder="Ex: 2024-2025"
            readOnly={readOnly}
          />
        </Typography>
      </Box>

      {/* Body Text */}
      <Box sx={{ textAlign: 'justify' }}>
        Precisamente às 
        <InlineInput 
          type="time" 
          value={formData.HoraInicioSessao || ''} 
          onChange={(e: any) => handleChange('HoraInicioSessao', e.target.value)}
          width="100px"
          readOnly={readOnly}
        />
        do dia 
        <InlineInput 
          type="text" 
          value={formData.DiaSessao || ''} 
          onChange={(e: any) => handleChange('DiaSessao', e.target.value)}
          width="200px"
          readOnly={readOnly}
        />
        da E∴ V∴, a Augusta, Respeitável e Benfeitora Loja Simbólica <b>{formData.lodge_name || '[NOME DA LOJA]'} n° {formData.lodge_number || '[NUMERO]'}</b>, 
        {formData.affiliation_text_1 ? ` ${formData.affiliation_text_1}, ` : ''}
        {formData.affiliation_text_2 ? ` ${formData.affiliation_text_2}, ` : ''}
        reuniu-se em seu Templo, sito à
        <InlineInput 
          value={formData.lodge_address || ''} 
          onChange={(e: any) => handleChange('lodge_address', e.target.value)}
          width="350px"
          textAlign="left"
          readOnly={readOnly}
        />, em
        <InlineInput 
            value={formData.session_title_formatted || ''} 
            onChange={(e: any) => handleChange('session_title_formatted', e.target.value)}
            width="400px"
            readOnly={readOnly}
        />
        , com 
        <InlineInput 
          type="number"
          value={formData.NumeroIrmaosQuadro || ''} 
          onChange={(e: any) => handleChange('NumeroIrmaosQuadro', e.target.value)}
          width="70px"
          readOnly={readOnly}
        />
        irmãos do quadro e 
        <InlineInput 
          type="number"
          value={formData.NumeroVisitantes || ''} 
          onChange={(e: any) => handleChange('NumeroVisitantes', e.target.value)}
          width="70px"
          readOnly={readOnly}
        />
        irmãos visitantes, ficando a Loja assim constituída:
      </Box>

      {/* Officers Grid */}
      <Box sx={{ mt: 3, mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px dashed #ccc' }}>
        <Grid container spacing={1} alignItems="center">
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 'bold', minWidth: 150, whiteSpace: 'nowrap', color: '#333' }}>Venerável Mestre:</Typography>
                    <InlineInput fullWidth width="100%" textAlign="left" value={formData.Veneravel || ''} onChange={(e: any) => handleChange('Veneravel', e.target.value)} readOnly={readOnly} />
                </Box>
            </Grid>
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 'bold', minWidth: 150, whiteSpace: 'nowrap', color: '#333' }}>1° Vigilante:</Typography>
                    <InlineInput fullWidth width="100%" textAlign="left" value={formData.PrimeiroVigilante || ''} onChange={(e: any) => handleChange('PrimeiroVigilante', e.target.value)} readOnly={readOnly} />
                </Box>
            </Grid>
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 'bold', minWidth: 150, whiteSpace: 'nowrap', color: '#333' }}>2° Vigilante:</Typography>
                    <InlineInput fullWidth width="100%" textAlign="left" value={formData.SegundoVigilante || ''} onChange={(e: any) => handleChange('SegundoVigilante', e.target.value)} readOnly={readOnly} />
                </Box>
            </Grid>
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 'bold', minWidth: 150, whiteSpace: 'nowrap', color: '#333' }}>Orador:</Typography>
                    <InlineInput fullWidth width="100%" textAlign="left" value={formData.Orador || ''} onChange={(e: any) => handleChange('Orador', e.target.value)} readOnly={readOnly} />
                </Box>
            </Grid>
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 'bold', minWidth: 150, whiteSpace: 'nowrap', color: '#333' }}>Secretário:</Typography>
                    <InlineInput fullWidth width="100%" textAlign="left" value={formData.Secretario || ''} onChange={(e: any) => handleChange('Secretario', e.target.value)} readOnly={readOnly} />
                </Box>
            </Grid>
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 'bold', minWidth: 150, whiteSpace: 'nowrap', color: '#333' }}>Chanceler:</Typography>
                    <InlineInput fullWidth width="100%" textAlign="left" value={formData.Chanceler || ''} onChange={(e: any) => handleChange('Chanceler', e.target.value)} readOnly={readOnly} />
                </Box>
            </Grid>
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 'bold', minWidth: 150, whiteSpace: 'nowrap', color: '#333' }}>Tesoureiro:</Typography>
                    <InlineInput fullWidth width="100%" textAlign="left" value={formData.Tesoureiro || ''} onChange={(e: any) => handleChange('Tesoureiro', e.target.value)} readOnly={readOnly} />
                </Box>
            </Grid>
        </Grid>
        <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', textAlign: 'center', color: '#666' }}>
            * Demais cargos preenchidos pelos seus titulares ou Irmãos do Quadro.
        </Typography>
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
