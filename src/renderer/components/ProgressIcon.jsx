import React from 'react';
import { Puff } from 'react-loader-spinner';

export const ProgressIcon = ({ height = 25, width = 25, visible = true }) => {
    return (
        <Puff
            visible={visible}
            height={height}
            width={width}
            ariaLabel="puff-loading"
            wrapperStyle={{}}
            wrapperClass="puff-wrapper"
        />
    )
}