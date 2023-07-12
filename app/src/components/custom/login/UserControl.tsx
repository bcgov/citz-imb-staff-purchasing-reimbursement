import {
  Button,
  ClickAwayListener,
  Grow,
  Paper,
  Popper,
  MenuItem,
  MenuList,
  Stack,
} from '@mui/material';
import { useAuthService } from '../../../keycloak';
import * as React from 'react';
import { buttonStyles } from '../../bcgov/ButtonStyles';
import { UserReport } from '../modals/UserReport';

/**
 * @description Component based off MUI Menu: https://mui.com/material-ui/react-menu/
 * @link https://mui.com/material-ui/react-menu/
 * @returns A React element that handles the user name, logout, login. Usually in Navigation Bar.
 */
const UserControl = () => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const { state: authState, getLoginURL, getLogoutURL } = useAuthService();
  const user = authState.userInfo;

  // Opens/closes dropdown
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  // Closes dropdown when item selected.
  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  // If keys are pressed when dropdown is open
  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }

    prevOpen.current = open;
  }, [open]);

  if (user) {
    return (
      <>
        <Stack direction='row' spacing={2}>
          <div>
            <Button
              ref={anchorRef}
              id='composition-button'
              aria-controls={open ? 'composition-menu' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-haspopup='true'
              sx={{ ...buttonStyles.secondary }}
              onClick={handleToggle}
            >
              {`${user.given_name} ${user.family_name}`}
            </Button>
            <Popper
              open={open}
              anchorEl={anchorRef.current}
              role={undefined}
              placement='bottom-start'
              transition
              disablePortal
            >
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin: placement === 'bottom-start' ? 'left top' : 'left bottom',
                  }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={handleClose}>
                      <MenuList
                        autoFocusItem={open}
                        id='composition-menu'
                        aria-labelledby='composition-button'
                        onKeyDown={handleListKeyDown}
                      >
                        <MenuItem
                          onClick={() => {
                            const thisDialog: HTMLDialogElement =
                              document.querySelector(`#user-issue`)!;
                            thisDialog.showModal();
                          }}
                        >
                          Submit Issue
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            window.location.href = getLogoutURL();
                          }}
                          aria-label='Logout'
                          aria-description='Logs the user out of their account.'
                        >
                          Logout
                        </MenuItem>
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </div>
        </Stack>
        <UserReport />
      </>
    );
  } else {
    return (
      <Button
        ref={anchorRef}
        id='composition-button'
        aria-controls={open ? 'composition-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup='true'
        aria-description='Proceeds to login page'
        aria-label='Log In'
        sx={{ ...buttonStyles.secondary }}
        onClick={() => {
          window.location.href = getLoginURL();
        }}
      >
        Log In
      </Button>
    );
  }
};

export default UserControl;
