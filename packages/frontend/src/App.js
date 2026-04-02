import React, { useMemo, useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import './App.css';

const PRIORITY_OPTIONS = [
  { value: 1, label: '1 - Top' },
  { value: 2, label: '2 - Important' },
  { value: 3, label: '3 - Normal' },
  { value: 4, label: '4 - Low' },
];

const sortTasks = (tasks) => {
  return [...tasks].sort((a, b) => {
    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : null;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : null;

    if (aDue === null && bDue !== null) return 1;
    if (aDue !== null && bDue === null) return -1;
    if (aDue !== null && bDue !== null && aDue !== bDue) return aDue - bDue;

    if (a.priority !== b.priority) return a.priority - b.priority;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
};

const isTaskUrgent = (task) => {
  if (!task.dueDate) {
    return false;
  }

  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return dueDay <= today;
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [form, setForm] = useState({
    title: '',
    dueDate: '',
    priority: 3,
  });
  const [editingTaskId, setEditingTaskId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setTasks(sortTasks(result));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch tasks: ${err.message}`);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', dueDate: '', priority: 3 });
    setEditingTaskId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const payload = {
      title: form.title.trim(),
      priority: Number(form.priority),
      dueDate: form.dueDate || null,
    };

    try {
      const isEditing = editingTaskId !== null;
      const url = isEditing ? `/api/tasks/${editingTaskId}` : '/api/tasks';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save task');
      }

      const result = await response.json();
      if (isEditing) {
        setTasks(sortTasks(tasks.map(task => (task.id === result.id ? result : task))));
      } else {
        setTasks(sortTasks([...tasks, result]));
      }

      resetForm();
      setError(null);
    } catch (err) {
      setError(`Error saving task: ${err.message}`);
      console.error('Error saving task:', err);
    }
  };

  const handleEdit = (task) => {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
      priority: task.priority,
    });
  };

  const handleDelete = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(tasks.filter(task => task.id !== taskId));
      setError(null);
    } catch (err) {
      setError(`Error deleting task: ${err.message}`);
      console.error('Error deleting task:', err);
    }
  };

  const matrixTasks = useMemo(() => {
    return sortedTasks.reduce(
      (acc, task) => {
        const highPriority = task.priority <= 2;
        const urgent = task.isOverdue || isTaskUrgent(task);
        const key = `${highPriority ? 'high' : 'normal'}_${urgent ? 'urgent' : 'notUrgent'}`;
        acc[key].push(task);
        return acc;
      },
      {
        high_urgent: [],
        high_notUrgent: [],
        normal_urgent: [],
        normal_notUrgent: [],
      }
    );
  }, [sortedTasks]);

  const renderTaskMeta = (task) => {
    const priority = PRIORITY_OPTIONS.find(item => item.value === task.priority);

    return (
      <Stack direction="row" spacing={1} alignItems="center" mt={1} flexWrap="wrap" useFlexGap>
        <Chip size="small" label={priority ? priority.label : `Priority ${task.priority}`} />
        <Chip
          size="small"
          variant="outlined"
          label={task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
        />
        {task.isOverdue && (
          <Tooltip title="Overdue task">
            <Chip
              size="small"
              color="error"
              icon={<PriorityHighIcon />}
              label="Overdue"
              aria-label="Overdue task"
            />
          </Tooltip>
        )}
      </Stack>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            TODO Planner
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track work by due date, priority, and urgency.
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {editingTaskId ? 'Edit task' : 'Add task'}
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Task title"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Due date"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      labelId="priority-label"
                      label="Priority"
                      value={form.priority}
                      onChange={(event) => setForm({ ...form, priority: event.target.value })}
                    >
                      {PRIORITY_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button type="submit" variant="contained">
                      {editingTaskId ? 'Save' : 'Add'}
                    </Button>
                    {editingTaskId && (
                      <Button type="button" variant="outlined" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="h6">Tasks</Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, nextView) => {
              if (nextView) {
                setViewMode(nextView);
              }
            }}
            aria-label="Task view mode"
          >
            <ToggleButton value="list">List</ToggleButton>
            <ToggleButton value="matrix">Eisenhower Matrix</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {loading && <Alert severity="info">Loading tasks...</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && viewMode === 'list' && (
          <Card>
            <CardContent>
              {sortedTasks.length === 0 ? (
                <Typography color="text.secondary">No tasks yet. Add your first task.</Typography>
              ) : (
                <List disablePadding>
                  {sortedTasks.map(task => (
                    <ListItem
                      key={task.id}
                      divider
                      secondaryAction={(
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => handleEdit(task)}>
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleDelete(task.id)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      )}
                    >
                      <ListItemText
                        primary={task.title}
                        secondary={renderTaskMeta(task)}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}

        {!loading && !error && viewMode === 'matrix' && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card data-testid="quadrant-high-urgent">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Priority 1-2 and Urgent/Overdue
                  </Typography>
                  {matrixTasks.high_urgent.map(task => (
                    <Box key={task.id} className="matrix-task">
                      <Typography variant="body2" fontWeight={600}>{task.title}</Typography>
                      {renderTaskMeta(task)}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card data-testid="quadrant-high-not-urgent">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Priority 1-2 and Not Urgent
                  </Typography>
                  {matrixTasks.high_notUrgent.map(task => (
                    <Box key={task.id} className="matrix-task">
                      <Typography variant="body2" fontWeight={600}>{task.title}</Typography>
                      {renderTaskMeta(task)}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card data-testid="quadrant-normal-urgent">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Priority 3-4 and Urgent/Overdue
                  </Typography>
                  {matrixTasks.normal_urgent.map(task => (
                    <Box key={task.id} className="matrix-task">
                      <Typography variant="body2" fontWeight={600}>{task.title}</Typography>
                      {renderTaskMeta(task)}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card data-testid="quadrant-normal-not-urgent">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Priority 3-4 and Not Urgent
                  </Typography>
                  {matrixTasks.normal_notUrgent.map(task => (
                    <Box key={task.id} className="matrix-task">
                      <Typography variant="body2" fontWeight={600}>{task.title}</Typography>
                      {renderTaskMeta(task)}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Stack>
    </Container>
  );
}

export default App;