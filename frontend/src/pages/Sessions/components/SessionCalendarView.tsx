import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Grid, 
  Tooltip, 
  Chip, 
  useTheme, 
  alpha 
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  Event as EventIcon, 
  CheckCircle, 
  PlayArrow, 
  Cancel 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Session {
  id: number;
  title: string;
  session_date: string;
  status: string;
  type?: string;
  subtype?: string;
}

interface SessionCalendarViewProps {
  sessions: Session[];
  basePath: string;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const SessionCalendarView: React.FC<SessionCalendarViewProps> = ({ sessions, basePath }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return days;
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<Grid item xs={1} key={`empty-${i}`} sx={{ height: 120, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySessions = sessions.filter(s => s.session_date === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <Grid 
          item 
          xs={1} // Takes 1 column out of 7
          key={day} 
          sx={{ 
            height: 120, 
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            p: 1,
            backgroundColor: isToday ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
            position: 'relative',
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.1)
            }
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: isToday ? 'bold' : 'normal',
              color: isToday ? 'primary.main' : 'text.secondary',
              mb: 1
            }}
          >
            {day}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, overflowY: 'auto', maxHeight: '85px' }}>
            {daySessions.map(session => (
              <Tooltip key={session.id} title={`${session.title} (${session.status})`}>
                <Chip
                  label={session.type || session.title}
                  size="small"
                  onClick={() => navigate(`${basePath}/${session.id}`)}
                  icon={
                    session.status === 'REALIZADA' ? <CheckCircle sx={{ fontSize: '12px !important' }} /> :
                    session.status === 'EM_ANDAMENTO' ? <PlayArrow sx={{ fontSize: '12px !important' }} /> :
                    session.status === 'CANCELADA' ? <Cancel sx={{ fontSize: '12px !important' }} /> :
                    <EventIcon sx={{ fontSize: '12px !important' }} />
                  }
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                    justifyContent: 'flex-start',
                    width: '100%',
                    backgroundColor: 
                        session.status === 'REALIZADA' ? alpha('#22c55e', 0.2) : 
                        session.status === 'ENCERRADA' ? alpha('#64748b', 0.2) : 
                        session.status === 'EM_ANDAMENTO' ? alpha(theme.palette.info.main, 0.2) :
                        session.status === 'CANCELADA' ? alpha(theme.palette.error.main, 0.2) :
                        alpha(theme.palette.warning.main, 0.2),
                    color: 
                        session.status === 'REALIZADA' ? '#15803d' : 
                        session.status === 'ENCERRADA' ? '#475569' : 
                        session.status === 'EM_ANDAMENTO' ? theme.palette.info.dark :
                        session.status === 'CANCELADA' ? theme.palette.error.dark :
                        theme.palette.warning.dark,
                    '& .MuiChip-label': {
                        paddingLeft: '4px',
                        paddingRight: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Grid>
      );
    }

    return days;
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: '16px', 
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton onClick={handlePrevMonth}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Days Header */}
      <Grid container columns={7} sx={{ mb: 1 }}>
        {DAYS_OF_WEEK.map(day => (
          <Grid item xs={1} key={day} sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Grid */}
      <Grid container columns={7}>
        {renderCalendarDays()}
      </Grid>
    </Paper>
  );
};

export default SessionCalendarView;
