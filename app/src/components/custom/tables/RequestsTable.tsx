import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  ListItemText,
  Checkbox,
  Button,
  InputAdornment,
} from '@mui/material';
import HeaderCell from './HeaderCell';
import CustomTableCell from './CustomTableCell';
import { ReimbursementRequest } from '../../../interfaces/ReimbursementRequest';
import { RequestStates, convertStateToStatus } from '../../../helpers/convertState';
import { bcgov } from '../../../constants/colours';
import LinkButton from '../../bcgov/LinkButton';
import { buttonStyles } from '../../bcgov/ButtonStyles';
import { useEffect, useState } from 'react';
import { useAuthService } from '../../../keycloak';
import CurrencyComparer, { Symbols } from '../searchFields/CurrencyComparer';
import SortButton, { SortState } from '../searchFields/SortButton';
import { FilterAlt } from '@mui/icons-material';
import PaginationControl, { PaginationControlObject } from './PaginationControl';

// Date Picker
import { DateRangePicker } from 'rsuite';
import 'rsuite/dist/rsuite.css';
import { dateRanges } from '../../../helpers/dateRanges';

/**
 * @interface
 * @description Properties passed to the RequestsTable component.
 * @property {Array} data - An array of ReimbursementRequests. See the ReimbursementRequest interface.
 */
interface RequestTableProps {
  data: Array<ReimbursementRequest>;
}

/**
 * @interface
 * @description Defines the properties of the DataManipulator Record
 */
interface DataManipulatorObject extends Record<string, any> {
  requestor: {
    filter: string;
    sort: SortState;
  };
  suppliers: {
    filter: string;
    sort: SortState;
  };
  cost: {
    filter: {
      symbol: Symbols;
      value: string;
    };
    sort: SortState;
  };
  submissionDate: {
    filter: {
      startDate: number;
      endDate: number;
    };
    sort: SortState;
  };
  status: {
    filter: RequestStates[];
    sort: SortState;
  };
}

/**
 * @description A table containing a series of reimbursement requests.
 * @param {RequestTableProps} props Properties passed to RequestsTable.
 * @returns A React table element.
 */
const RequestsTable = (props: RequestTableProps) => {
  const { data: propData } = props;
  const [data, setData] = useState<Array<ReimbursementRequest>>(propData); // Main data state
  const selectItems = [
    RequestStates.INCOMPLETE,
    RequestStates.INPROGRESS,
    RequestStates.SUBMITTED,
    RequestStates.COMPLETE,
    RequestStates.DELETED,
  ]; // Possible selection items for filter
  const defaultSelectItems = [
    RequestStates.INCOMPLETE,
    RequestStates.INPROGRESS,
    RequestStates.SUBMITTED,
  ]; // Default selected items for filter
  const weekOfMilliseconds = 604800000; // One week of milliseconds.
  // The default state for data manipulation. Used for filtering and sorting.
  const defaultManipulator: DataManipulatorObject = {
    requestor: {
      filter: '',
      sort: SortState.UNSORTED,
    },
    suppliers: {
      filter: '',
      sort: SortState.UNSORTED,
    },
    cost: {
      filter: {
        symbol: Symbols.GT,
        value: '',
      },
      sort: SortState.UNSORTED,
    },
    submissionDate: {
      filter: {
        startDate: Date.now() - weekOfMilliseconds * 2,
        endDate: Date.now(),
      },
      sort: SortState.DESCENDING,
    },
    status: {
      filter: defaultSelectItems,
      sort: SortState.UNSORTED,
    },
  };

  // Gets the stored value from local storage or sets the default value if there is none.
  const getStartingDataManipulator = () => {
    if (sessionStorage.getItem('dataManipulator')) {
      return JSON.parse(sessionStorage.getItem('dataManipulator')!) as DataManipulatorObject;
    } else {
      return defaultManipulator;
    }
  };

  // Data manipulation state. Filtering and sorting.
  const [dataManipulator, setDataManipulator] = useState<DataManipulatorObject>(
    getStartingDataManipulator(),
  );

  // Pagination state. Used to break the records into pages.
  const [paginationControlObject, setPaginationControlObject] = useState<PaginationControlObject>({
    currentPage: 1,
    rowsPerPage: 30,
    totalRecords: data.length,
  });

  // Page data, the info only shown on the current page. e.g. 1 of 3
  const [pageData, setPageData] = useState<Array<ReimbursementRequest>>(propData);
  const { state: authState } = useAuthService();
  const isAdmin = authState.userInfo.client_roles?.includes('admin');

  // Resets data if the prop updates or if the filter/sort params change.
  useEffect(() => {
    const filteredData = filterData(propData) || propData;
    const sortedData = sortData(filteredData);
    setData(sortedData);
    // Set pagination back to start
    setPaginationControlObject({
      ...paginationControlObject,
      currentPage: 1,
      totalRecords: sortedData.length,
    });
    sessionStorage.setItem('dataManipulator', JSON.stringify(dataManipulator));
  }, [propData, dataManipulator]);

  // Slices the data in to a page's worth of records if the pagination control changes.
  useEffect(() => {
    setPageData(
      [...data].splice(
        (paginationControlObject.currentPage - 1) * paginationControlObject.rowsPerPage,
        paginationControlObject.rowsPerPage,
      ),
    );
  }, [paginationControlObject]);

  /**
   * @description Sorts the data in the table based on the dataManipulator state object.
   * @param {Array<ReimbursementRequest>} data An array of reimbursement request records.
   * @returns {Array<ReimbursementRequest>} The sorted array of data.
   */
  const sortData: (data: Array<ReimbursementRequest>) => Array<ReimbursementRequest> = (
    data: Array<ReimbursementRequest>,
  ) => {
    // Which field are we sorting by?
    // Undefined can't be an index type, but sort field could be undefined if all values are UNSORTED. Default back to submissionDate if that's the case.
    const sortField =
      Object.keys(dataManipulator).find(
        (key) => dataManipulator[key].sort !== SortState.UNSORTED,
      ) || 'submissionDate';
    // Which direction are we sorting?
    const direction = dataManipulator[sortField].sort;
    // Perform sort based on sortField
    switch (sortField) {
      case 'requestor':
        // Check if ascending, otherwise it's descending.
        if (direction === SortState.ASCENDING) {
          return data.sort((a, b) => a.firstName.localeCompare(b.firstName)); // Webkit doesn't accept boolean, so need local compare.
        } else {
          return data.sort((a, b) => b.firstName.localeCompare(a.firstName));
        }
      case 'suppliers':
        if (direction === SortState.ASCENDING) {
          return data.sort((a, b) =>
            a.purchases.at(0)!.supplier.localeCompare(b.purchases.at(0)!.supplier),
          );
        } else {
          return data.sort((a, b) =>
            b.purchases.at(0)!.supplier.localeCompare(a.purchases.at(0)!.supplier),
          );
        }
      case 'cost':
        if (direction === SortState.ASCENDING) {
          return data.sort(
            (a, b) =>
              a.purchases.reduce((total, purchase) => total + purchase.cost, 0) -
              b.purchases.reduce((total, purchase) => total + purchase.cost, 0),
          );
        } else {
          return data.sort(
            (a, b) =>
              b.purchases.reduce((total, purchase) => total + purchase.cost, 0) -
              a.purchases.reduce((total, purchase) => total + purchase.cost, 0),
          );
        }
      case 'submissionDate':
        if (direction === SortState.ASCENDING) {
          return data.sort((a, b) => a.submissionDate.localeCompare(b.submissionDate));
        } else {
          return data; // Should already be sorted descending from API.
        }
      case 'status':
        if (direction === SortState.ASCENDING) {
          return data.sort((a, b) =>
            convertStateToStatus(a.state).localeCompare(convertStateToStatus(b.state)),
          );
        } else {
          return data.sort((a, b) =>
            convertStateToStatus(b.state).localeCompare(convertStateToStatus(a.state)),
          );
        }
      default:
        return data; // Default is descending by date.
    }
  };

  /**
   * @description Sets the sort field depending on which element was clicked.
   * @param e The event from the clicked element.
   */
  const setSortField = (e: any) => {
    const targetField = e.currentTarget.id; // currentTarget gets element with event listener, not element that triggered event
    const tempManipulator = { ...dataManipulator };
    // Set all fields to Unsorted, unless it's the target field
    Object.keys(tempManipulator).forEach((key) => {
      if (key !== targetField) {
        tempManipulator[key].sort = SortState.UNSORTED;
      }
    });
    // Update desired field with new sort value
    tempManipulator[targetField].sort = getNextSortValue(dataManipulator[targetField].sort);
    setDataManipulator(tempManipulator);
  };

  /**
   * @description Determines the next sort state value based on a provided value.
   * @param {SortState} value The current sort state.
   * @returns {SortState} The next applicable sort state.
   */
  const getNextSortValue = (value: SortState) => {
    switch (value) {
      case SortState.DESCENDING:
        return SortState.UNSORTED;
      case SortState.ASCENDING:
        return SortState.DESCENDING;
      default:
        return SortState.ASCENDING;
    }
  };

  /**
   * @description Filters data based on the dataManipulator state and returns
   * @param {Array<ReimbursementRequest>} data The data to be sorted.
   * @returns {Array<ReimbursementRequest>} Sorted data.
   */
  const filterData: (data: Array<ReimbursementRequest>) => Array<ReimbursementRequest> = (
    data: Array<ReimbursementRequest>,
  ) => {
    const filteredData: Array<ReimbursementRequest> = data.filter((request) => {
      // Check if requestor matches
      const requestorMatch = () => {
        if (
          dataManipulator.requestor.filter === '' || // Don't filter out if field is blank
          request.firstName
            .toLowerCase()
            .includes(dataManipulator.requestor.filter.toLowerCase().trim()) ||
          request.lastName
            .toLowerCase()
            .includes(dataManipulator.requestor.filter.toLowerCase().trim())
        ) {
          return true;
        }
        return false;
      };

      // Check if any suppliers match
      const suppliersMatch = () => {
        if (
          dataManipulator.suppliers.filter === '' || // Don't filter out if field is blank
          request.purchases.some((purchase) =>
            purchase.supplier
              .toLowerCase()
              .includes(dataManipulator.suppliers.filter.toLowerCase().trim()),
          )
        ) {
          return true;
        }
        return false;
      };

      // Check if the currency value matches the filter
      const costMatch = () => {
        const costValue: string = dataManipulator.cost.filter.value;
        const costSymbol: Symbols = dataManipulator.cost.filter.symbol;
        if (costValue === '') return true; // Don't filter out if field is blank
        if (!parseFloat(costValue)) return true; // Always return if it's NaN. (Junk entered in filter) Shouldn't happen, but just in case.

        const costValueInt = parseFloat(costValue);

        if (costSymbol === Symbols.GT) {
          // If comparing for greater than
          if (
            parseFloat(request.purchases.reduce((acc, curr) => acc + curr.cost, 0).toFixed(2)) >=
            costValueInt
          )
            return true;
          else return false;
        } else if (costSymbol === Symbols.LT) {
          // If comparing for less than
          if (
            parseFloat(request.purchases.reduce((acc, curr) => acc + curr.cost, 0).toFixed(2)) <=
            costValueInt
          )
            return true;
          else return false;
        }
        return false;
      };

      // Check if date falls on or between the start and end date selected
      // Dates from the date picker are in UTC, but so are the submissionDates.
      const dateMatch = () => {
        const { startDate } = dataManipulator.submissionDate.filter;
        const { endDate } = dataManipulator.submissionDate.filter;
        const recordDate = new Date(request.submissionDate).getTime();
        if (!startDate && !endDate) return true; // If both are undefined for some reason.
        if (startDate && endDate && recordDate >= startDate && recordDate <= endDate) {
          return true;
        }
        return false;
      };

      // Check if record matches one of the selected statuses
      const statusMatch = () => {
        const currentSelection = dataManipulator.status.filter;
        if (currentSelection.includes(request.state)) {
          return true;
        }
        return false;
      };

      // Decide if this record is included in filter
      if (requestorMatch() && suppliersMatch() && costMatch() && dateMatch() && statusMatch())
        return true;

      // If not matching any of the above, don't include
      return false;
    });
    return filteredData;
  };

  /**
   * @description Updates the dataManipulator with the appropriate value if it passes regex check.
   * @param e The event from the CurrencyComparer component.
   */
  const updateCostFilter = (e: any) => {
    // eslint-disable-next-line no-useless-escape
    const regex = /^[0-9\.]*$/;
    if (regex.test(e.target.value)) {
      setDataManipulator({
        ...dataManipulator,
        cost: {
          ...dataManipulator.cost,
          filter: {
            ...dataManipulator.cost.filter,
            value: e.target.value,
          },
        },
      });
    }
  };

  /**
   * @description Changes the symbol in the CurrencyComparer component when clicked. Also updates the dataManipulator.
   */
  const changeSymbol = () => {
    const newSymbol = dataManipulator.cost.filter.symbol === Symbols.GT ? Symbols.LT : Symbols.GT;
    setDataManipulator({
      ...dataManipulator,
      cost: {
        ...dataManipulator.cost,
        filter: {
          ...dataManipulator.cost.filter,
          symbol: newSymbol,
        },
      },
    });
  };

  /**
   * @description Updates the dataManipulator with the new multiselect status value.
   * @param e The event from the Select component.
   */
  const updateStatusFilter = (e: any) => {
    setDataManipulator({
      ...dataManipulator,
      status: {
        ...dataManipulator.status,
        filter: e.target.value,
      },
    });
  };

  /**
   * @description Updates the dataManipulator with the new text value for basic TextInput fields.
   * @param e The event from the TextField component.
   */
  const updateManipulator = (e: any) => {
    const tempManipulator = { ...dataManipulator };
    tempManipulator[e.target.id].filter = e.target.value;
    setDataManipulator(tempManipulator);
  };

  /**
   * @description Resets the dataManipulator to the default value.
   */
  const resetFilter = () => {
    setDataManipulator(defaultManipulator);
    sessionStorage.removeItem('dataManipulator');
  };

  const filterStyle = {
    display: 'block',
    maxWidth: '14em',
    marginTop: '5px',
  };

  const filterInputStyle = {
    color: bcgov.text,
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label='simple table'>
          <TableHead>
            <TableRow>
              <HeaderCell>
                Requestor Name
                <SortButton
                  id='requestor'
                  currentValue={dataManipulator.requestor.sort}
                  onChange={setSortField}
                />
                <TextField
                  id='requestor'
                  variant='standard'
                  name='requestor'
                  aria-label='Requestor Filter Field'
                  aria-description='Enter text here to filter the table data.'
                  sx={{
                    ...filterStyle,
                    width: '90%',
                  }}
                  value={dataManipulator.requestor.filter}
                  onChange={updateManipulator}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <FilterAlt fontSize='small' />
                      </InputAdornment>
                    ),
                    sx: {
                      ...filterInputStyle,
                    },
                  }}
                />
              </HeaderCell>
              <HeaderCell>
                Vendors
                <SortButton
                  id='suppliers'
                  currentValue={dataManipulator.suppliers.sort}
                  onChange={setSortField}
                />
                <TextField
                  id='suppliers'
                  variant='standard'
                  name='suppliers'
                  aria-label='Vendors Filter Field'
                  aria-description='Enter text here to filter the table data.'
                  sx={{
                    ...filterStyle,
                    width: '90%',
                  }}
                  onChange={updateManipulator}
                  value={dataManipulator.suppliers.filter}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <FilterAlt fontSize='small' />
                      </InputAdornment>
                    ),
                    sx: {
                      ...filterInputStyle,
                    },
                  }}
                />
              </HeaderCell>
              <HeaderCell>
                Total Cost
                <SortButton
                  id='cost'
                  currentValue={dataManipulator.cost.sort}
                  onChange={setSortField}
                />
                <CurrencyComparer
                  sx={{ ...filterStyle }}
                  value={dataManipulator.cost.filter.value}
                  buttonValue={dataManipulator.cost.filter.symbol}
                  onChange={updateCostFilter}
                  {...{ changeSymbol }}
                />
              </HeaderCell>
              <HeaderCell>
                Submission Date
                <SortButton
                  id='submissionDate'
                  currentValue={dataManipulator.submissionDate.sort}
                  onChange={setSortField}
                />
                <DateRangePicker
                  id='submissionDate'
                  editable={false}
                  placeholder='Select Range'
                  cleanable={false}
                  showOneCalendar
                  aria-label='Submission Date Filter Field'
                  aria-description='Select this element to choose dates for filtering.'
                  // DateRangePicker must take an array of exactly two dates.
                  value={[
                    new Date(dataManipulator.submissionDate.filter.startDate),
                    new Date(dataManipulator.submissionDate.filter.endDate),
                  ]}
                  style={{
                    ...filterStyle,
                    color: bcgov.text,
                  }}
                  ranges={dateRanges}
                  onClean={(e) => {
                    if (e) {
                      const tempManipulator = { ...dataManipulator };
                      tempManipulator.submissionDate.filter.startDate =
                        defaultManipulator.submissionDate.filter.startDate;
                      tempManipulator.submissionDate.filter.endDate =
                        defaultManipulator.submissionDate.filter.endDate;
                      setDataManipulator(tempManipulator);
                    }
                  }}
                  onChange={(e) => {
                    if (e) {
                      const tempManipulator = { ...dataManipulator };
                      tempManipulator.submissionDate.filter.startDate = new Date(e[0]).setHours(
                        0,
                        0,
                        0,
                        0,
                      ); // From the beginning of this day
                      tempManipulator.submissionDate.filter.endDate = new Date(e[1]).setHours(
                        23,
                        59,
                        59,
                        0,
                      ); // To the end of this day
                      setDataManipulator(tempManipulator);
                    }
                  }}
                />
              </HeaderCell>
              <HeaderCell>
                Status
                <SortButton
                  id='status'
                  currentValue={dataManipulator.status.sort}
                  onChange={setSortField}
                />
                <Select
                  labelId='status'
                  id='statusFilter'
                  multiple
                  variant='standard'
                  value={dataManipulator.status.filter}
                  name='statusFilter'
                  aria-label='Status Filter Field'
                  aria-description='Select options here to filter the table data.'
                  onChange={updateStatusFilter}
                  renderValue={(selected) => {
                    if (selected.length === selectItems.length) {
                      return 'All';
                    }
                    return 'Filtered';
                  }}
                  sx={{
                    ...filterStyle,
                    color: bcgov.text,
                  }}
                >
                  {selectItems.map((name) => {
                    // Don't show deleted as an option unless you're the admin
                    if (name === RequestStates.DELETED && !isAdmin) {
                      return;
                    }
                    return (
                      <MenuItem key={name} value={name} aria-label={`Status ${name.toString()}`}>
                        <Checkbox checked={dataManipulator.status.filter.indexOf(name) > -1} />
                        <ListItemText primary={convertStateToStatus(name)} />
                      </MenuItem>
                    );
                  })}
                </Select>
              </HeaderCell>
              <HeaderCell>
                <Button sx={{ ...buttonStyles.secondary }} onClick={resetFilter}>
                  Reset Filter
                </Button>
              </HeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!pageData || pageData.length === 0 ? (
              <TableRow>
                <CustomTableCell>No requests available.</CustomTableCell>
              </TableRow>
            ) : (
              pageData.map((row, index) => (
                <TableRow
                  key={row._id}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    backgroundColor: index % 2 === 0 ? bcgov.white : bcgov.backgroundSecondary,
                  }}
                >
                  <CustomTableCell>{`${row.firstName} ${row.lastName}`}</CustomTableCell>
                  <CustomTableCell>
                    <span style={{ whiteSpace: 'pre-line' }}>
                      {row.purchases.map((purchase) => purchase.supplier).join(',\n')}
                    </span>
                  </CustomTableCell>
                  <CustomTableCell>{`$${row.purchases
                    .reduce((total, purchase) => total + purchase.cost, 0)
                    .toFixed(2)}`}</CustomTableCell>
                  <CustomTableCell>
                    {new Date(row.submissionDate).toLocaleDateString()}
                  </CustomTableCell>
                  <CustomTableCell>{convertStateToStatus(row.state)}</CustomTableCell>
                  <CustomTableCell>
                    <LinkButton
                      link={`/request/${row._id}`}
                      style={buttonStyles.primary}
                      ariaDescription='Goes to specific page for this request.'
                    >
                      More
                    </LinkButton>
                  </CustomTableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <PaginationControl
        controlObject={paginationControlObject}
        setControlObject={setPaginationControlObject}
      />
    </>
  );
};

export default RequestsTable;
