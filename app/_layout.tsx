import { Stack } from 'expo-router';

import { SnackbarProvider } from '../src/components/Snackbar';
import { DatabaseProvider } from '../src/db/DatabaseProvider';
import { ThemeProvider } from '../src/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SnackbarProvider>
        <DatabaseProvider>
          <Stack />
        </DatabaseProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
