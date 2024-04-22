import * as React from "react";

import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { usePagination } from "@table-library/react-table-library/pagination";


const TweetTablePagination2 = ({ nodes }) => {

    const [search, setSearch] = React.useState("");

    let data = { nodes };

    debugger;

    const handleSearch = (event) => {
        setSearch(event.target.value);
    };

    data = {
        nodes: data.nodes.filter((item) =>
            item.tweetText.toLowerCase().includes(search.toLowerCase())
        ),
    };


    const theme = useTheme(getTheme());

    const pagination = usePagination(data, {
        state: {
            page: 0,
            size: 2,
        },
        onChange: onPaginationChange,
    });

    function onPaginationChange(action, state) {
        console.log(action, state);
    }

    const columns = [
        { label: 'Tweet', renderCell: (item) => item.tweetText },
    ];
    return (
        <>
            <CompactTable
                columns={columns}
                data={data}
                theme={theme}
                pagination={pagination}
            />

            <br />
            <div style={{ display: "flex", justifyContent: "space-between" }}>

                <div className="search-box p-[11px] text-left flex justify-between">
                    <div>
                        Search by Tweet Text:
                    </div>
                    <div className='bg-red'>
                        <input id="search" type="text" value={search} onChange={handleSearch} className='border' />
                    </div>
                </div>

                <span>Total Pages: {pagination.state.getTotalPages(data.nodes)}</span>

                <span>
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
                </span>
            </div>

            <br />
        </>
    );
};

export default TweetTablePagination2;