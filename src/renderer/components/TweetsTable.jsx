import * as React from "react";
import { useState } from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { usePagination } from "@table-library/react-table-library/pagination";


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
        setTweetData('');
    };

    data = {
        nodes: data.nodes.filter((item) =>
            item.tweetText.toLowerCase().includes(search.toLowerCase())
        ),
    };

    const displayTweet = (tweetData) => {
        debugger;
        setTweetData(tweetData);
        setIsDialogOpen(true);
    }

    const TweetDialog = ({ tweetData, onClose }) => {
        return (
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#fff',
                padding: '20px',
                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
            }}>
                <h3>Tweet Data</h3>
                <p>{tweetData.tweetText}</p>
                <button onClick={onClose}>Close</button>
            </div>
        );
    };

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

            {isDialogOpen && <TweetDialog tweetData={tweetData} onClose={handleClose} />}
        </>
    );
};

export default TweetsTable;