import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export function BasicSelect({ tags, handleSelectChange }) {
  const [tag, setTag] = React.useState('');

  const handleChange = (event) => {
    let tagFilter = event.target.value;

    if (tagFilter == 'clean-the-filter-123') {
      tagFilter = '';
    }
    setTag(tagFilter);
    handleSelectChange(tagFilter);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Tags</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={tag}
          label="Age"
          onChange={handleChange}
        >
          {tags.map((tag) => (
            <MenuItem key={tag} value={tag}>
              {tag}
            </MenuItem>
          ))}
          {/* Manual MenuItem */}
          <MenuItem value="clean-the-filter-123" key="clean-tag-filter">
            Clean tag filter
          </MenuItem>
        </Select>

      </FormControl>
    </Box>
  );
}
