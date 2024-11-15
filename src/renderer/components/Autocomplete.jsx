import React, { useState } from "react";
import { TextField, Autocomplete, Chip } from "@mui/material";

export const TweetTags = ({ initialTags, availableTags, onTagsChange }) => {
    const [tags, setTags] = useState(initialTags);

    const handleChange = (event, newValue) => {
        setTags(newValue);
        onTagsChange(newValue);
    };

    return (
        <Autocomplete
            multiple
            freeSolo
            options={availableTags}
            value={tags}
            onChange={handleChange}
            renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                    <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                    />
                ))
            }
            renderInput={(params) => (
                <TextField {...params} label="Tags" placeholder="Add tags" />
            )}
        />
    );
};
