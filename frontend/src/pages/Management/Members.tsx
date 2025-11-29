import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Button, 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Avatar, 
  Chip, 
  TextField, 
  InputAdornment,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  useTheme,
  alpha
} from '@mui/material';
import { Search, Download, Add } from '@mui/icons-material';
import api from '../../services/api';
import { MemberResponse } from '../../types';

const Members = () => {
  const theme = useTheme();
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    cim: true,
    full_name: true,
    email: true,
    degree: true,
    role: true,
    registration_status: true,
    phone: false,
    birth_date: false
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/members');
        setMembers(response.data);
      } catch (error) {
        console.error('Falha ao buscar membros', error);
      }
    };

    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member => 
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const headers = [];
    const keys: (keyof typeof exportColumns)[] = [];

    if (exportColumns.cim) { headers.push('CIM'); keys.push('cim'); }
    if (exportColumns.full_name) { headers.push('Nome'); keys.push('full_name'); }
    if (exportColumns.email) { headers.push('Email'); keys.push('email'); }
    if (exportColumns.degree) { headers.push('Grau'); keys.push('degree'); }
    if (exportColumns.role) { headers.push('Cargo'); keys.push('role'); }
    if (exportColumns.registration_status) { headers.push('Status'); keys.push('registration_status'); }
    if (exportColumns.phone) { headers.push('Telefone'); keys.push('phone'); }
    if (exportColumns.birth_date) { headers.push('Data Nascimento'); keys.push('birth_date'); }

    const csvContent = [
      headers.join(','),
      ...filteredMembers.map(member => {
        return keys.map(key => {
          if (key === 'role') return `"${member.active_role || 'Membro'}"`;
          if (key === 'birth_date') return member.birth_date ? new Date(member.birth_date).toLocaleDateString('pt-BR') : '';
          return `"${member[key as keyof MemberResponse] || ''}"`;
        }).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'membros_sigma.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOpenExportDialog(false);
  };

  const handleColumnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExportColumns({
      ...exportColumns,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: '800', color: 'primary.main', letterSpacing: '-0.5px' }}>
          Gestão de Membros
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Download />} 
            onClick={() => setOpenExportDialog(true)}
            sx={{ 
              fontWeight: '600',
              textTransform: 'none',
              borderRadius: '8px',
              borderColor: alpha(theme.palette.primary.main, 0.5),
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          >
            Exportar
          </Button>
          <Button 
            component={Link} 
            to="/dashboard/management/members/new" 
            variant="contained" 
            color="primary"
            startIcon={<Add />}
            sx={{ 
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)',
              }
            }}
          >
            Novo Membro
          </Button>
        </Box>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: '16px', 
          backgroundColor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar membro por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            mb: 0,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: alpha(theme.palette.background.default, 0.5),
              '& fieldset': {
                borderColor: alpha(theme.palette.divider, 0.2),
              },
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer 
        component={Box} // Changed from Paper to Box to remove default white background/shadow
        sx={{ 
          backgroundColor: 'transparent',
          overflowX: 'auto'
        }}
      >
        <Table 
          sx={{ 
            borderCollapse: 'separate', 
            borderSpacing: '0 8px', // Creates space between rows
            minWidth: 650
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, pl: 3 }}>FOTO (THUMBNAIL)</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>CIM</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>NOME</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>GRAU</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>CARGO</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>STATUS CADASTRO</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, textAlign: 'right', pr: 3 }}>AÇÕES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow 
                key={member.id} 
                sx={{ 
                  backgroundColor: alpha(theme.palette.background.paper, 0.4), // Darker row background
                  '&:hover': { 
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <TableCell 
                  sx={{ 
                    borderBottom: 'none', 
                    py: 1, // Reduced padding
                    pl: 3,
                    borderTopLeftRadius: '50px', // Rounded left side
                    borderBottomLeftRadius: '50px',
                    color: 'text.primary'
                  }}
                >
                  <Avatar 
                    src={member.profile_picture_path ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${member.profile_picture_path}` : undefined} 
                    alt={member.full_name}
                    sx={{ 
                      width: 32, // Smaller avatar
                      height: 32, 
                      border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`
                    }} 
                  />
                </TableCell>
                <TableCell sx={{ borderBottom: 'none', py: 1, fontSize: '0.8rem', fontWeight: 500, color: 'text.primary' }}>{member.cim || '-'}</TableCell>
                <TableCell sx={{ borderBottom: 'none', py: 1, fontSize: '0.8rem', fontWeight: 500, color: 'text.primary' }}>{member.full_name}</TableCell>
                <TableCell sx={{ borderBottom: 'none', py: 1, fontSize: '0.8rem', color: 'text.secondary' }}>{member.degree || '-'}</TableCell>
                <TableCell sx={{ borderBottom: 'none', py: 1, fontSize: '0.8rem', color: 'text.secondary' }}>
                  {member.active_role || 'Membro'}
                </TableCell>
                <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                  <Chip 
                    label={member.registration_status} 
                    size="small" 
                    sx={{ 
                      height: '22px',
                      fontSize: '0.7rem',
                      backgroundColor: member.registration_status === 'Aprovado' ? '#22c55e' : alpha(theme.palette.warning.main, 0.8), // Vibrant green
                      color: '#fff', // White text for contrast
                      fontWeight: 700,
                      borderRadius: '12px',
                      px: 1
                    }} 
                  />
                </TableCell>
                <TableCell 
                  sx={{ 
                    borderBottom: 'none', 
                    py: 1, 
                    textAlign: 'right',
                    pr: 3,
                    borderTopRightRadius: '50px', // Rounded right side
                    borderBottomRightRadius: '50px'
                  }}
                >
                  <Button 
                    component={Link} 
                    to={`/dashboard/management/members/edit/${member.id}`} 
                    variant="text" 
                    size="small"
                    sx={{ 
                      color: 'text.primary',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      minWidth: 'auto',
                      padding: '4px 8px',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.05)'
                      }
                    }}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openExportDialog} 
        onClose={() => setOpenExportDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Exportar Membros</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Selecione os campos que deseja incluir no arquivo CSV:
          </Typography>
          <FormGroup>
            <FormControlLabel control={<Checkbox checked={exportColumns.cim} onChange={handleColumnChange} name="cim" />} label="CIM" />
            <FormControlLabel control={<Checkbox checked={exportColumns.full_name} onChange={handleColumnChange} name="full_name" />} label="Nome Completo" />
            <FormControlLabel control={<Checkbox checked={exportColumns.email} onChange={handleColumnChange} name="email" />} label="Email" />
            <FormControlLabel control={<Checkbox checked={exportColumns.degree} onChange={handleColumnChange} name="degree" />} label="Grau" />
            <FormControlLabel control={<Checkbox checked={exportColumns.role} onChange={handleColumnChange} name="role" />} label="Cargo" />
            <FormControlLabel control={<Checkbox checked={exportColumns.registration_status} onChange={handleColumnChange} name="registration_status" />} label="Status" />
            <FormControlLabel control={<Checkbox checked={exportColumns.phone} onChange={handleColumnChange} name="phone" />} label="Telefone" />
            <FormControlLabel control={<Checkbox checked={exportColumns.birth_date} onChange={handleColumnChange} name="birth_date" />} label="Data de Nascimento" />
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenExportDialog(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
          <Button onClick={handleExport} variant="contained" color="primary" sx={{ borderRadius: '8px', fontWeight: 600 }}>Exportar CSV</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Members;