import * as React from "react";
import { useState } from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { usePagination } from "@table-library/react-table-library/pagination";
import { TweetDetailDialog } from "./TweetDetailDialog";

const TweetsTable = ({ nodes }) => {

    const [search, setSearch] = React.useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tweetData, setTweetData] = useState('');

    let data = { nodes };

    const handleSearch = (event) => {
        setSearch(event.target.value);
    };

    const handleClose = () => {
        setIsDialogOpen(false);
        setTweetData(null);
    };

    data = {
        nodes: data.nodes.filter((item) =>
            item.tweetText.toLowerCase().includes(search.toLowerCase())
        ),
    };

    const displayTweet = (tweetData) => {
        setTweetData(tweetData);
        setIsDialogOpen(true);
    }

    const stripedTheme = {
        BaseRow: `
            font-size: 14px;
          `,
        HeaderRow: `
            background-color: #eaf5fd;
          `,
        Row: `
            &:nth-of-type(odd) {
              background-color: #d2e9fb;
            }
    
            &:nth-of-type(even) {
              background-color: #eaf5fd;
            }
          `,
    };

    const marginTheme = {
        BaseCell: `
            margin: 9px;
            padding: 11px;
          `,
    };

    const colorTheme = {
        BaseRow: `
            color: #141414;
          `,
        Row: `
            &:hover {
              color: orange;
            }
    
            cursor: pointer;
          `,
    };

    const theme = useTheme([colorTheme, stripedTheme, marginTheme]);

    const pagination = usePagination(data, {
        state: {
            page: 0,
            size: 10,
        },
        onChange: onPaginationChange,
    });

    function onPaginationChange(action, state) {
        console.log(action, state);
    }

    const columns = [
        {
            label: 'Tweet', renderCell: (item) => {
                const columnContent = `${item.twitterHandle} : ${item.tweetText}`
                return (<a onClick={() => { displayTweet(item) }}>{columnContent}</a>)
            }
        },
    ];
    const handleTagsUpdate = (tweetId, newTags) => {
        console.log("Updated tags:", newTags);
        window.savedXApi.updateTagsForTweet(tweetId, newTags);
        // Update the database or state with the new tags
    };

    return (
        <>

            <div className="search-box p-[11px] text-left flex justify-between">
                <div>
                    Search by Tweet Text:
                </div>
                <div className='bg-red'>
                    <input id="search" type="text" value={search} onChange={handleSearch} className='border' />
                </div>
            </div>

            <CompactTable
                columns={columns}
                data={data}
                theme={theme}
                pagination={pagination}
            />

            <div className="search-box p-[11px] text-left flex justify-between">
                <div>Total Pages: {pagination.state.getTotalPages(data.nodes)}</div>
                <div>
                    Page:{" "}
                    {pagination.state.getPages(data.nodes).map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            style={{
                                fontWeight: pagination.state.page === index ? "bold" : "normal",
                            }}
                            onClick={() => pagination.fns.onSetPage(index)}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            <TweetDetailDialog
                open={isDialogOpen}
                tweetData={tweetData}
                onTagsUpdate={handleTagsUpdate}
                onClose={handleClose}
            />
        </>
    );
};

export default TweetsTable;