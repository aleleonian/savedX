import React from 'react';
import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";

const columns = [
    { label: 'Tweet', renderCell: (item) => item.tweetText },
    // {
    //   label: 'Deadline',
    //   renderCell: (item) =>
    //     item.deadline.toLocaleDateString('en-US', {
    //       year: 'numeric',
    //       month: '2-digit',
    //       day: '2-digit',
    //     }),
    // },
    // { label: 'Type', renderCell: (item) => item.type },
    // {
    //   label: 'Complete',
    //   renderCell: (item) => item.isComplete.toString(),
    // },
    // { label: 'Tasks', renderCell: (item) => item.nodes },
];

// const nodes = [
//   {
//     id: '0',
//     name: 'Shopping List',
//     deadline: new Date(2020, 1, 15),
//     type: 'TASK',
//     isComplete: true,
//     nodes: 3,
//   },
// ];

export const TweetTable = ({ nodes }) => {

    let data = { nodes };

    const theme = useTheme(getTheme());

    const [search, setSearch] = React.useState("");

    const handleSearch = (event) => {
        setSearch(event.target.value);
    };

    data = {
        nodes: data.nodes.filter((item) =>
            item.tweetText.toLowerCase().includes(search.toLowerCase())
        ),
    };

    return (
        <>

            <label htmlFor="search">
                Search by Tweet Text:&nbsp;
                <input id="search" type="text" value={search} onChange={handleSearch} />
            </label>
            <br />

            <CompactTable columns={columns} data={data} theme={theme}/>
        </>
    )
}