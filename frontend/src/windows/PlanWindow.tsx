import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  styled, 
  Paper, 
  IconButton, 
  TextField, 
  Checkbox, 
  ListItem, 
  ListItemText, 
  List, 
  ListItemIcon,
  Chip,
  Tooltip,
  Divider,
  Menu,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

// Styled components
const PlanContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const PlanHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.75, 1),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const PlanTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const PlanActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

const PlanContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(1),
}));

const TaskInput = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const StyledListItem = styled(ListItem, {
  shouldForwardProp: prop => prop !== 'completed'
})<{ completed?: boolean }>(({ theme, completed }) => ({
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(0.5),
  backgroundColor: theme.palette.background.default,
  opacity: completed ? 0.7 : 1,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const TaskText = styled(ListItemText, {
  shouldForwardProp: prop => prop !== 'completed'
})<{ completed?: boolean }>(({ theme, completed }) => ({
  '& .MuiTypography-root': {
    textDecoration: completed ? 'line-through' : 'none',
    color: completed ? theme.palette.text.secondary : theme.palette.text.primary,
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.75rem',
}));

const PriorityChip = styled(Chip, {
  shouldForwardProp: prop => prop !== 'priority'
})<{ priority: 'low' | 'medium' | 'high' }>(({ theme, priority }) => {
  const colors = {
    low: theme.palette.info.main,
    medium: theme.palette.warning.main,
    high: theme.palette.error.main,
  };
  
  return {
    height: 24,
    fontSize: '0.75rem',
    backgroundColor: 'transparent',
    border: `1px solid ${colors[priority]}`,
    color: colors[priority],
  };
});

// Types
interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
}

interface PlanWindowProps {
  agentOnly?: boolean;
}

const PlanWindow: React.FC<PlanWindowProps> = ({ agentOnly = true }) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      text: 'Research AI transformer models',
      completed: false,
      priority: 'high',
      dueDate: '2023-06-15',
      tags: ['research', 'AI'],
    },
    {
      id: '2',
      text: 'Implement WebSocket communication',
      completed: false,
      priority: 'medium',
      dueDate: '2023-06-20',
      tags: ['backend', 'communication'],
    },
    {
      id: '3',
      text: 'Design user interface mockups',
      completed: true,
      priority: 'medium',
      tags: ['design', 'UI'],
    },
    {
      id: '4',
      text: 'Set up development environment',
      completed: true,
      priority: 'low',
      tags: ['setup', 'environment'],
    },
  ]);
  
  const [newTaskText, setNewTaskText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'added'>('added');
  const [priorityAnchorEl, setPriorityAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const handleAddTask = () => {
    if (newTaskText.trim() === '') return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      priority: 'medium',
      tags: [],
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskText('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };
  
  const handleToggleComplete = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };
  
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  const handlePriorityClick = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setPriorityAnchorEl(event.currentTarget);
    setSelectedTaskId(id);
  };
  
  const handlePriorityClose = () => {
    setPriorityAnchorEl(null);
    setSelectedTaskId(null);
  };
  
  const handlePriorityChange = (priority: 'low' | 'medium' | 'high') => {
    if (selectedTaskId) {
      setTasks(tasks.map(task => 
        task.id === selectedTaskId ? { ...task, priority } : task
      ));
    }
    handlePriorityClose();
  };
  
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });
  
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityValues = { high: 3, medium: 2, low: 1 };
      return (priorityValues[b.priority] || 0) - (priorityValues[a.priority] || 0);
    }
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0; // Default, preserve original order
  });
  
  const getPriorityIcon = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return <PriorityHighIcon fontSize="small" color="error" />;
      case 'medium':
        return <PriorityHighIcon fontSize="small" color="warning" />;
      case 'low':
        return <LowPriorityIcon fontSize="small" color="info" />;
      default:
        return null;
    }
  };
  
  const priorityMenu = (
    <Menu
      anchorEl={priorityAnchorEl}
      open={Boolean(priorityAnchorEl)}
      onClose={handlePriorityClose}
    >
      <MenuItem onClick={() => handlePriorityChange('high')}>
        <PriorityHighIcon fontSize="small" color="error" sx={{ mr: 1 }} />
        High
      </MenuItem>
      <MenuItem onClick={() => handlePriorityChange('medium')}>
        <PriorityHighIcon fontSize="small" color="warning" sx={{ mr: 1 }} />
        Medium
      </MenuItem>
      <MenuItem onClick={() => handlePriorityChange('low')}>
        <LowPriorityIcon fontSize="small" color="info" sx={{ mr: 1 }} />
        Low
      </MenuItem>
    </Menu>
  );
  
  return (
    <PlanContainer>
      <PlanHeader>
        <PlanTitle>
          <PlaylistAddCheckIcon fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Planner</Typography>
        </PlanTitle>
        <PlanActions>
          {agentOnly && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Agent-controlled
            </Typography>
          )}
          <Tooltip title="Filter tasks">
            <IconButton 
              size="small" 
              onClick={() => {
                setFilter(filter === 'all' ? 'active' : filter === 'active' ? 'completed' : 'all');
              }}
            >
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sort tasks">
            <IconButton 
              size="small"
              onClick={() => {
                setSortBy(sortBy === 'added' ? 'priority' : sortBy === 'priority' ? 'dueDate' : 'added');
              }}
            >
              <SortIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </PlanActions>
      </PlanHeader>
      
      <TaskInput>
        <StyledTextField
          size="small"
          fullWidth
          placeholder="Add a new task..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <IconButton 
          size="small" 
          color="primary" 
          onClick={handleAddTask}
          disabled={newTaskText.trim() === ''}
        >
          <AddIcon />
        </IconButton>
      </TaskInput>
      
      <Box sx={{ px: 1, py: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {filter === 'all' ? 'All tasks' : filter === 'active' ? 'Active tasks' : 'Completed tasks'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
        </Typography>
      </Box>
      
      <Divider sx={{ mx: 1 }} />
      
      <PlanContent>
        <List sx={{ px: 0 }}>
          {sortedTasks.map(task => (
            <StyledListItem 
              key={task.id} 
              completed={task.completed ? true : undefined}
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Change priority">
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={(e) => handlePriorityClick(e, task.id)}
                    >
                      {getPriorityIcon(task.priority)}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete task">
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox
                  edge="start"
                  checked={task.completed}
                  onChange={() => handleToggleComplete(task.id)}
                  icon={<RadioButtonUncheckedIcon />}
                  checkedIcon={<CheckCircleIcon />}
                  sx={{ 
                    color: task.completed ? 'success.main' : 'text.secondary',
                    padding: 0.5
                  }}
                />
              </ListItemIcon>
              <TaskText 
                primary={task.text} 
                completed={task.completed ? true : undefined}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {task.dueDate && (
                      <StyledChip
                        size="small"
                        icon={<ScheduleIcon fontSize="small" />}
                        label={new Date(task.dueDate).toLocaleDateString()}
                      />
                    )}
                    {task.tags.map(tag => (
                      <StyledChip
                        key={tag}
                        size="small"
                        label={tag}
                      />
                    ))}
                  </Box>
                }
              />
            </StyledListItem>
          ))}
        </List>
      </PlanContent>
      
      {priorityMenu}
    </PlanContainer>
  );
};

export default PlanWindow; 