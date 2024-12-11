import React from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";

const columns = [{ label: "Tweet", renderCell: (item) => item.tweetText }];

export const TweetTable = ({ nodes }) => {
  let data = { nodes };

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

  const [search, setSearch] = React.useState("");

  const handleSearch = (event) => {
    setSearch(event.target.value);
  };

  data = {
    nodes: data.nodes.filter((item) =>
      item.tweetText.toLowerCase().includes(search.toLowerCase()),
    ),
  };

  return (
    <>
      <div className="search-box p-[11px] text-left flex justify-between">
        <div>Search by Tweet Text:</div>
        <div className="bg-red">
          <input
            id="search"
            type="text"
            value={search}
            onChange={handleSearch}
            className="border"
          />
        </div>
      </div>

      <CompactTable columns={columns} data={data} theme={theme} />
    </>
  );
};
