import sys
import re

with open(r'C:\Users\engan\onedrive\Área de Trabalho\sigma\frontend\src\modules\members\pages\MemberForm.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

ui_section = '''      {/* DECORATIONS */}
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

if 'DECORATIONS' not in text:
    text = text.replace('      {/* FAMILY */}', ui_section + '\n      {/* FAMILY */}')
    with open(r'C:\Users\engan\onedrive\Área de Trabalho\sigma\frontend\src\modules\members\pages\MemberForm.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Patched UI Section successfully!')
else:
    print('DECORATIONS already exists!')
