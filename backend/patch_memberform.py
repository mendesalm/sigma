import sys
import re

with open(r'C:\Users\engan\onedrive\Área de Trabalho\sigma\frontend\src\modules\members\pages\MemberForm.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add WorkspacePremiumIcon import
import_icon = "import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';\n"
text = re.sub(r'(import Groups as FamilyIcon,\n)', r'\1' + import_icon, text)

# 2. Add DecorationLocal interface
decoration_iface = '''interface DecorationLocal {
  id?: number;
  title: string;
  award_date: string;
  remarks: string;
}
'''
text = re.sub(r'(interface FamilyMemberLocal {[\s\S]*?\n}\n)', r'\1\n' + decoration_iface, text)

# 3. Add state
state_code = '  const [decorations, setDecorations] = useState<DecorationLocal[]>([]);\n'
text = re.sub(r'(  const \[familyMembers, setFamilyMembers\] = useState<FamilyMemberLocal\[\]>\(\[\]\);\n)', r'\1' + state_code, text)

# 4. Map in fetchMember
map_code = '''
          if (memberData.decorations) {
            setDecorations(memberData.decorations.map(d => ({
              id: d.id,
              title: d.title,
              award_date: d.award_date || '',
              remarks: d.remarks || ''
            })));
          }
'''
text = re.sub(r'(          if \(memberData\.family_members\) {[\s\S]*?}\n)', r'\1' + map_code, text)

# 5. Handlers
handlers_code = '''
  const handleDecorationChange = (index: number, field: keyof DecorationLocal, value: any) => {
    const updated = [...decorations];
    updated[index] = { ...updated[index], [field]: value };
    setDecorations(updated);
  };
  const addDecoration = () => {
    setDecorations([...decorations, { title: '', award_date: '', remarks: '' }]);
  };
  const removeDecoration = (index: number) => {
    const updated = [...decorations];
    updated.splice(index, 1);
    setDecorations(updated);
  };
'''
text = re.sub(r'(  const removeFamilyMember = \(index: number\) => {[\s\S]*?  };\n)', r'\1' + handlers_code, text)

# 6. Include in payload
payload_code = '''
      const formattedDecorations = decorations.map(d => ({
        id: d.id,
        title: d.title,
        award_date: d.award_date || undefined,
        remarks: d.remarks || undefined
      }));
'''
text = re.sub(r'(      const formattedFamilyMembers = familyMembers\.map\(fm => \({[\s\S]*?}\)\);\n)', r'\1' + payload_code, text)

payload_push = '        decorations: formattedDecorations,\n'
text = re.sub(r'(        family_members: formattedFamilyMembers,\n)', r'\1' + payload_push, text)

# 7. UI Section
ui_section = '''
        {/* DECORATIONS */}
        <Card sx={{ bgcolor: alpha(theme.palette.background.paper, 0.4), backdropFilter: 'blur(10px)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <SectionTitle title="Títulos e Diplomas" icon={WorkspacePremiumIcon} theme={theme} />
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addDecoration} sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}>Adicionar</Button>
            </Box>
            <Grid container spacing={2}>
              {decorations.map((dec, index) => (
                <Grid key={index} size={{ xs: 12, xl: 6 }}>
                  <Paper sx={{ p: 2, bgcolor: theme.palette.background.default, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main }}>Título #{index + 1}</Typography>
                      <IconButton size="small" color="error" onClick={() => removeDecoration(index)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, sm: 8 }}><TextField label="Título" size="small" value={dec.title} onChange={(e) => handleDecorationChange(index, 'title', e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
                      <Grid size={{ xs: 12, sm: 4 }}><TextField label="Data" type="date" size="small" value={dec.award_date} onChange={(e) => handleDecorationChange(index, 'award_date', e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
                      <Grid size={{ xs: 12 }}><TextField label="Observações (Loja, Registro)" size="small" value={dec.remarks} onChange={(e) => handleDecorationChange(index, 'remarks', e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
'''
text = re.sub(r'(        {/\* FAMILY \*/}\n        <Card)', ui_section + r'\n\1', text)

with open(r'C:\Users\engan\onedrive\Área de Trabalho\sigma\frontend\src\modules\members\pages\MemberForm.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
