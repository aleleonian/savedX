import React from "react";
import {
  Table,
  Header,
  HeaderRow,
  Body,
  Row,
  HeaderCell,
  Cell,
} from "@table-library/react-table-library/table";
import { useTheme } from "@table-library/react-table-library/theme";

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

export const DataTable = ({ dataForTable, clickHandler, pagination }) => {
  const beginning = pagination.page * pagination.size;
  const end = beginning + pagination.size;
  const dataCopy = { ...dataForTable };
  dataCopy.nodes = dataCopy.nodes.slice(beginning, end);
  return (
    <Table data={dataCopy} theme={theme}>
      {(tableList) => (
        <>
          <Header>
            <HeaderRow>
              <HeaderCell>Tweet Text</HeaderCell>
            </HeaderRow>
          </Header>

          <Body>
            {tableList.map((item) => {
              return (
                <Row
                  key={item.id}
                  item={item}
                  onClick={() => clickHandler(item)}
                >
                  <Cell>{item.tweetText}</Cell>
                </Row>
              );
            })}
          </Body>
        </>
      )}
    </Table>
  );
};
