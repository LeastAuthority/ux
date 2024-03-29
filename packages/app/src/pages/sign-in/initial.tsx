import React, { useState, createRef } from 'react';
import { Screen, ScreenBody, ScreenActions, Title, ScreenFooter, ScreenHeader } from '@screen';
import { Box, Text, Input, Flex, Button, space } from '@stacks/ui';
import { AppIcon } from '@components/app-icon';
import { Link } from '@components/link';
import useDocumentTitle from '@rehooks/document-title';
import { useDispatch, useSelector } from 'react-redux';
import { SIGN_IN_CORRECT, SIGN_IN_CREATE, SIGN_IN_INCORRECT } from '@common/track';
import { doSetMagicRecoveryCode } from '@store/onboarding/actions';
import { ScreenPaths } from '@store/onboarding/types';
import { AppState } from '@store';
import { selectAppName } from '@store/onboarding/selectors';
import { useWallet } from '@common/hooks/use-wallet';
import { ErrorLabel } from '@components/error-label';
import { useAnalytics } from '@common/hooks/use-analytics';
import { ExtensionButton } from '@components/extension-button';

const textAreaRef = createRef<HTMLTextAreaElement>();

const hasLineReturn = (input: string) => input.includes('\n');

interface SignInProps {
  next: () => void;
  back: () => void;
}

export const SignIn: React.FC<SignInProps> = props => {
  const { doStoreSeed } = useWallet();
  const [isLoading, setLoading] = useState(false);
  const [seed, setSeed] = useState('');
  const [seedError, setSeedError] = useState<null | string>(null);
  const dispatch = useDispatch();
  const appName = useSelector((state: AppState) => selectAppName(state));
  const { doChangeScreen, doTrack } = useAnalytics();
  const title = `Sign in to ${appName}`;
  useDocumentTitle(title);

  const onSubmit = async () => {
    setLoading(true);
    const parsedKeyInput = seed.trim();
    try {
      if (parsedKeyInput.length === 0) {
        setSeedError('Entering your Secret Key is required.');
        setLoading(false);
        return;
      }
      if (parsedKeyInput.split(' ').length <= 1) {
        dispatch(doSetMagicRecoveryCode(parsedKeyInput));
        doChangeScreen(ScreenPaths.RECOVERY_CODE);
        return;
      }
      await doStoreSeed(parsedKeyInput);
      doTrack(SIGN_IN_CORRECT);
      props.next();
    } catch (error) {
      setSeedError("The Secret Key you've entered is invalid");
      doTrack(SIGN_IN_INCORRECT);
    }
    setLoading(false);
  };

  return (
    <Screen onSubmit={onSubmit} isLoading={isLoading} textAlign="center">
      <ScreenHeader />
      <AppIcon mt={10} />
      <ScreenBody
        mt={4}
        body={[
          <Title>{title}</Title>,
          <Box mt={2}>Enter your Secret Key to continue</Box>,
          <Box textAlign="left" mt={6}>
            {/*Validate: track SIGN_IN_INCORRECT*/}
            <Input
              autoFocus
              minHeight="68px"
              placeholder="Enter your Secret Key"
              as="textarea"
              value={seed}
              fontSize={'16px'}
              width="100%"
              autoCapitalize="off"
              spellCheck={false}
              style={{ resize: 'none' }}
              ref={textAreaRef as any}
              onChange={async (evt: React.FormEvent<HTMLInputElement>) => {
                setSeedError(null);
                setSeed(evt.currentTarget.value);
                if (hasLineReturn(evt.currentTarget.value)) {
                  textAreaRef.current?.blur();
                  await onSubmit();
                }
              }}
            />
            {seedError && (
              <ErrorLabel lineHeight="16px">
                <Text
                  textAlign="left"
                  textStyle="caption"
                  color="feedback.error"
                  data-test="sign-in-seed-error"
                >
                  {seedError}
                </Text>
              </ErrorLabel>
            )}
          </Box>,
        ]}
      />
      <ScreenActions>
        <Flex justifyContent="space-between" alignItems="center" width="100%" mt={6}>
          <Link
            color="blue"
            onClick={() => {
              doTrack(SIGN_IN_CREATE);
              doChangeScreen(ScreenPaths.GENERATION);
            }}
          >
            Create a Secret Key
          </Link>
          <Button
            size="lg"
            type="submit"
            data-test="sign-in-key-continue"
            onClick={async (event: MouseEvent) => {
              event.preventDefault();
              return onSubmit();
            }}
          >
            Continue
          </Button>
        </Flex>
      </ScreenActions>
      <ScreenFooter flexWrap="wrap" mt={space('base')}>
        <ExtensionButton my={space('base')} />
      </ScreenFooter>
    </Screen>
  );
};
