import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { HelpCircle } from '@geist-ui/icons';
import { PencilSquareIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { EnvironmentAndAccount } from '@nangohq/server';
import { Tooltip, useModal } from '@geist-ui/core';
import { useSWRConfig } from 'swr';

import type { IntegrationConfig } from '../../types';
import { AuthModes } from '../../types';
import { useDeleteIntegrationAPI, useCreateIntegrationAPI, useEditIntegrationAPI, useEditIntegrationNameAPI } from '../../utils/api';
import Info from '../../components/ui/Info';
import ActionModal from '../../components/ui/ActionModal';
import SecretInput from '../../components/ui/input/SecretInput';
import SecretTextArea from '../../components/ui/input/SecretTextArea';
import { formatDateToShortUSFormat, defaultCallback } from '../../utils/utils';
import CopyButton from '../../components/ui/button/CopyButton';
import TagsInput from '../../components/ui/input/TagsInput';
import { useStore } from '../../store';

interface AuthSettingsProps {
    integration: IntegrationConfig | null;
    environment: EnvironmentAndAccount['environment'];
}

export default function AuthSettings(props: AuthSettingsProps) {
    const { mutate } = useSWRConfig();
    const { integration, environment } = props;

    const [serverErrorMessage, setServerErrorMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [modalAction, setModalAction] = useState<(() => void) | null>(null);
    const [modalShowSpinner, setModalShowSpinner] = useState(false);
    const [modalTitleColor, setModalTitleColor] = useState('text-white');

    const [showEditIntegrationIdMenu, setShowEditIntegrationIdMenu] = useState(false);
    const [integrationIdEdit, setIntegrationIdEdit] = useState('');
    const [integrationId, setIntegrationId] = useState(integration?.unique_key || '');

    const navigate = useNavigate();
    const env = useStore((state) => state.env);

    const { setVisible, bindings } = useModal();
    const editIntegrationAPI = useEditIntegrationAPI(env);
    const editIntegrationNameAPI = useEditIntegrationNameAPI(env);
    const createIntegrationAPI = useCreateIntegrationAPI(env);
    const deleteIntegrationAPI = useDeleteIntegrationAPI(env);

    const onDelete = async () => {
        if (!integration) return;

        setModalShowSpinner(true);
        const res = await deleteIntegrationAPI(integrationId);

        if (res?.status === 204) {
            toast.success('Integration deleted!', { position: toast.POSITION.BOTTOM_CENTER });
            clearCache();
            navigate(`/${env}/integrations`, { replace: true });
        }
        setModalShowSpinner(false);
        setVisible(false);
    };

    const deleteButtonClicked = async () => {
        setModalTitle('Delete integration?');
        setModalTitleColor('text-pink-600');
        setModalContent('Are you sure you want to delete this integration?');
        setModalAction(() => () => onDelete());
        setVisible(true);
    };

    const clearCache = () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/v1/integration'), undefined);
    };

    const handleSave = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setServerErrorMessage('');

        if (integrationId) {
            if (!integration) {
                return;
            }

            const target = e.target as typeof e.target & {
                client_id: { value: string };
                client_secret: { value: string };
                private_key: { value: string };
                scopes: { value: string };
                app_id: { value: string };
                app_link: { value: string };
                incoming_webhook_secret: { value: string };
            };

            const client_secret = integration?.auth_mode === AuthModes.App ? target.private_key?.value : target.client_secret?.value;
            const client_id = integration?.auth_mode === AuthModes.App ? target.app_id?.value : target.client_id?.value;

            const private_key = integration?.auth_mode === AuthModes.App || AuthModes.Custom ? target.private_key?.value : target.client_secret?.value;
            const appId = integration?.auth_mode === AuthModes.App || AuthModes.Custom ? target.app_id?.value : target.client_id?.value;

            let custom: Record<string, string> | undefined = integration?.auth_mode === AuthModes.Custom ? { app_id: appId, private_key } : undefined;

            if (target.incoming_webhook_secret?.value) {
                custom = { webhookSecret: target.incoming_webhook_secret.value };
            }

            const res = await editIntegrationAPI(
                integration.provider,
                integration.auth_mode,
                integrationId,
                client_id,
                client_secret,
                target.scopes?.value,
                target.app_link?.value,
                custom
            );

            if (res?.status === 200) {
                toast.success('Integration updated!', { position: toast.POSITION.BOTTOM_CENTER });
                clearCache();
            }
        } else {
            const target = e.target as typeof e.target & {
                provider: { value: string };
                unique_key: { value: string };
                app_id: { value: string };
                private_key: { value: string };
                client_id: { value: string };
                client_secret: { value: string };
                scopes: { value: string };
                app_link: { value: string };
            };

            const [provider] = target.provider.value.split('|');

            const client_secret = integration?.auth_mode === AuthModes.App ? target.private_key?.value : target.client_secret?.value;
            const client_id = integration?.auth_mode === AuthModes.App ? target.app_id?.value : target.client_id?.value;

            const private_key = integration?.auth_mode === AuthModes.App || AuthModes.Custom ? target.private_key?.value : target.client_secret?.value;
            const appId = integration?.auth_mode === AuthModes.App || AuthModes.Custom ? target.app_id?.value : target.client_id?.value;

            const custom = integration?.auth_mode === AuthModes.Custom ? { app_id: appId, private_key } : undefined;

            const res = await createIntegrationAPI(
                provider,
                integration?.auth_mode as AuthModes,
                target.unique_key?.value,
                client_id,
                client_secret,
                target.scopes?.value,
                target.app_link?.value,
                custom
            );

            if (res?.status === 200) {
                toast.success('Integration created!', { position: toast.POSITION.BOTTOM_CENTER });
                clearCache();
                navigate(`/${env}/integrations`, { replace: true });
            } else if (res != null) {
                const payload = await res.json();
                toast.error(payload.type === 'duplicate_provider_config' ? 'Unique Key already exists.' : payload.error, {
                    position: toast.POSITION.BOTTOM_CENTER
                });
            }
        }
    };

    const editIntegrationID = () => {
        setShowEditIntegrationIdMenu(true);
        setIntegrationIdEdit(integrationId);
        setIsTyping(false);
    };

    const onSaveIntegrationID = async () => {
        setShowEditIntegrationIdMenu(false);
        setIntegrationIdEdit('');
        setIsTyping(false);

        if (!integration) {
            return;
        }

        const res = await editIntegrationNameAPI(integrationId, integrationIdEdit);

        if (res?.status === 200) {
            toast.success('Integration ID updated!', { position: toast.POSITION.BOTTOM_CENTER });
            setIntegrationId(integrationIdEdit);
            navigate(`/${env}/integration/${integrationIdEdit}`, { replace: true });
            clearCache();
        } else if (res != null) {
            const payload = await res.json();
            toast.error(payload.error, {
                position: toast.POSITION.BOTTOM_CENTER
            });
        }
    };

    const onCancelEditIntegrationID = () => {
        setShowEditIntegrationIdMenu(false);
        setIntegrationIdEdit('');
        setIsTyping(false);
    };

    return (
        <form className="mx-auto space-y-12 text-sm w-[976px]" onSubmit={handleSave} autoComplete="one-time-code">
            <ActionModal
                bindings={bindings}
                modalTitle={modalTitle}
                modalContent={modalContent}
                modalAction={modalAction}
                modalShowSpinner={modalShowSpinner}
                modalTitleColor={modalTitleColor}
                setVisible={setVisible}
            />
            <input type="text" className="hidden" name="username" autoComplete="username" />
            <input type="password" className="hidden" name="password" autoComplete="password" />
            <div className="flex">
                <div className="flex flex-col w-1/2">
                    <span className="text-gray-400 text-xs uppercase mb-1">API Provider</span>
                    <span className="text-white">{integration?.provider}</span>
                </div>
                <div className="flex flex-col w-1/2 relative">
                    <span className="text-gray-400 text-xs uppercase mb-1">Integration ID</span>
                    {showEditIntegrationIdMenu ? (
                        <div className="flex items-center">
                            <input
                                value={integrationIdEdit}
                                onChange={(e) => {
                                    setIntegrationIdEdit(e.target.value);
                                    setIsTyping(true);
                                }}
                                className="bg-active-gray w-full text-white rounded-md px-3 py-0.5 mt-0.5 focus:border-white"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onSaveIntegrationID();
                                    }
                                }}
                            />
                            <XCircleIcon
                                className="flex ml-1 h-5 w-5 text-red-400 cursor-pointer hover:text-red-700"
                                onClick={() => onCancelEditIntegrationID()}
                            />
                        </div>
                    ) : (
                        <div className="flex text-white">
                            <span className="mr-2">{integrationId}</span>
                            {integration?.connection_count === 0 && (
                                <PencilSquareIcon className="flex h-5 w-5 cursor-pointer hover:text-zinc-400" onClick={() => editIntegrationID()} />
                            )}
                        </div>
                    )}
                    {isTyping && integrationIdEdit && (
                        <div className="flex items-center border border-border-gray bg-active-gray text-white rounded-md px-3 py-0.5 mt-0.5 cursor-pointer">
                            <PencilSquareIcon className="flex h-5 w-5 cursor-pointer hover:text-zinc-400" onClick={() => onSaveIntegrationID()} />
                            <span className="mt-0.5 cursor-pointer ml-1" onClick={() => onSaveIntegrationID()}>
                                Change the integration ID to: {integrationIdEdit}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex">
                <div className="flex flex-col w-1/2">
                    <span className="text-gray-400 text-xs uppercase mb-1">Creation Date</span>
                    <span className="text-white">{formatDateToShortUSFormat(integration?.created_at as string)}</span>
                </div>
                <div className="flex flex-col w-1/2">
                    <span className="text-gray-400 text-xs uppercase mb-1">Auth Type</span>
                    <span className="text-white">{integration?.auth_mode}</span>
                </div>
            </div>
            {(integration?.auth_mode === AuthModes.OAuth1 || integration?.auth_mode === AuthModes.OAuth2 || integration?.auth_mode === AuthModes.Custom) && (
                <div className="flex">
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs uppercase">Callback Url</span>
                        </div>
                        <span className="flex items-center gap-2">
                            <span className="text-white">{environment.callback_url || defaultCallback()}</span>
                            <CopyButton text={environment.callback_url || defaultCallback()} dark />
                        </span>
                    </div>
                </div>
            )}
            {integration?.auth_mode === AuthModes.App && environment.callback_url && (
                <div className="flex">
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs uppercase">Setup URL</span>
                            <Tooltip
                                type="dark"
                                text={
                                    <>
                                        <div className="flex text-white text-sm">
                                            <p>{`Register this setup URL on the app settings page in the "Post Installation section". Check "Redirect on update" as well.`}</p>
                                        </div>
                                    </>
                                }
                            >
                                <HelpCircle color="gray" className="h-3 ml-1"></HelpCircle>
                            </Tooltip>
                        </div>
                        <span className="flex items-center gap-2">
                            <span className="text-white">{environment.callback_url.replace('oauth/callback', 'app-auth/connect')}</span>
                            <CopyButton text={environment.callback_url.replace('oauth/callback', 'app-auth/connect')} dark />
                        </span>
                    </div>
                </div>
            )}
            {integration?.unique_key && integration?.has_webhook && (
                <>
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs uppercase">Webhook Url</span>
                            <Tooltip
                                type="dark"
                                text={
                                    <>
                                        <div className="flex text-white text-sm">
                                            <p>{`Register this webhook URL on the developer portal of the Integration Provider to receive incoming webhooks.${integration?.auth_mode === AuthModes.Custom ? ' Use this for github organizations that need app approvals.' : ''}`}</p>
                                        </div>
                                    </>
                                }
                            >
                                <HelpCircle color="gray" className="h-3 ml-1"></HelpCircle>
                            </Tooltip>
                        </div>
                        <div className="flex text-white items-center gap-2">
                            <span className="text-white">{`${environment.webhook_receive_url}/${integrationId}`}</span>
                            <CopyButton text={`${environment.webhook_receive_url}/${integrationId}`} dark />
                        </div>
                    </div>
                    {(integration?.auth_mode === AuthModes.App || integration?.auth_mode === AuthModes.Custom) && integration?.webhook_secret && (
                        <div className="flex flex-col">
                            <div className="flex items-center mb-1">
                                <span className="text-gray-400 text-xs uppercase">Webhook Secret</span>
                                <Tooltip
                                    type="dark"
                                    text={
                                        <>
                                            <div className="flex text-white text-sm">
                                                <p>{`Input this secret into the "Webhook secret (optional)" field in the Webhook section`}</p>
                                            </div>
                                        </>
                                    }
                                >
                                    <HelpCircle color="gray" className="h-3 ml-1"></HelpCircle>
                                </Tooltip>
                            </div>
                            <div className="flex text-white items-center gap-2">
                                <span className="text-white">{integration?.webhook_secret}</span>
                                <CopyButton text={integration?.webhook_secret} dark />
                            </div>
                        </div>
                    )}
                    {integration.has_webhook_user_defined_secret && (
                        <div className="flex flex-col w-full">
                            <div className="flex items-center mb-1">
                                <span className="text-gray-400 text-xs uppercase">Webhook Secret</span>
                                <Tooltip
                                    type="dark"
                                    text={
                                        <>
                                            <div className="flex text-white text-sm">
                                                <p>{`Obtain the Webhook Secret from on the developer portal of the Integration Provider.`}</p>
                                            </div>
                                        </>
                                    }
                                >
                                    <HelpCircle color="gray" className="h-3 ml-1"></HelpCircle>
                                </Tooltip>
                            </div>
                            <div className="flex text-white w-full">
                                <SecretInput
                                    copy={true}
                                    id="incoming_webhook_secret"
                                    name="incoming_webhook_secret"
                                    autoComplete="one-time-code"
                                    defaultValue={integration ? integration.custom?.webhookSecret : ''}
                                    additionalclass={`w-full`}
                                    required
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
            {(integration?.auth_mode === AuthModes.Basic || integration?.auth_mode === AuthModes.ApiKey) && (
                <Info size={20} color="blue">
                    The &quot;{integration?.provider}&quot; integration provider uses {integration?.auth_mode === AuthModes.Basic ? 'basic auth' : 'API Keys'}{' '}
                    for authentication (
                    <a
                        href="https://docs.nango.dev/integrate/guides/authorize-an-api"
                        className="text-white underline hover:text-text-light-blue"
                        rel="noreferrer"
                        target="_blank"
                    >
                        docs
                    </a>
                    ).
                </Info>
            )}
            {(integration?.auth_mode === AuthModes.App || integration?.auth_mode === AuthModes.Custom) && (
                <>
                    <div className="flex">
                        <div className="flex flex-col w-1/2">
                            <span className="text-gray-400 text-xs uppercase mb-1">App ID</span>
                            <div className="mt-1">
                                <input
                                    id="app_id"
                                    name="app_id"
                                    type="text"
                                    defaultValue={
                                        integration ? (integration?.auth_mode === AuthModes.Custom ? integration.custom?.app_id : integration.client_id) : ''
                                    }
                                    placeholder="Obtain the app id from the app page."
                                    autoComplete="new-password"
                                    required
                                    minLength={1}
                                    className="border-border-gray bg-active-gray text-white focus:border-white focus:ring-white block w-5/6 appearance-none rounded-md border px-3 py-0.5 text-sm placeholder-gray-400 shadow-sm focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col w-1/2">
                            <span className="text-gray-400 text-xs uppercase mb-1">App Public Link</span>
                            <div className="mt-1">
                                <input
                                    id="app_link"
                                    name="app_link"
                                    type="text"
                                    defaultValue={integration ? integration.app_link : ''}
                                    placeholder="Obtain the app public link from the app page."
                                    autoComplete="new-password"
                                    required
                                    minLength={1}
                                    className="border-border-gray bg-active-gray text-white focus:border-white focus:ring-white block w-5/6 appearance-none rounded-md border px-3 py-0.5 text-sm placeholder-gray-400 shadow-sm focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs">App Private Key</span>
                            <Tooltip
                                type="dark"
                                text={
                                    <>
                                        <div className="flex text-white text-sm">
                                            <p>{`Obtain the app private key from the app page by downloading the private key and pasting the entirety of its contents here.`}</p>
                                        </div>
                                    </>
                                }
                            >
                                <HelpCircle color="gray" className="h-3 ml-1"></HelpCircle>
                            </Tooltip>
                        </div>
                        <div className="flex text-white items-center">
                            <div className="mt-1 w-full">
                                <SecretTextArea
                                    copy={true}
                                    id="private_key"
                                    name="private_key"
                                    defaultValue={
                                        integration
                                            ? integration?.auth_mode === AuthModes.Custom
                                                ? integration.custom?.private_key
                                                : integration.client_secret
                                            : ''
                                    }
                                    additionalclass={`w-full`}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
            {(integration?.auth_mode === AuthModes.OAuth1 || integration?.auth_mode === AuthModes.OAuth2 || integration?.auth_mode === AuthModes.Custom) && (
                <>
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs">Client ID</span>
                        </div>
                        <div className="flex text-white mt-1 items-center">
                            <div className="w-full relative">
                                <input
                                    id="client_id"
                                    name="client_id"
                                    type="text"
                                    defaultValue={integration ? integration.client_id : ''}
                                    autoComplete="one-time-code"
                                    placeholder="Find the Client ID on the developer portal of the external API provider."
                                    required
                                    minLength={1}
                                    className="border-border-gray bg-active-gray text-white focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-0.5 text-sm placeholder-gray-400 shadow-sm focus:outline-none"
                                />
                                <span className="absolute right-0.5 top-1 flex items-center">
                                    <CopyButton text={integration?.client_id} dark className="relative -ml-6" />
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs">Client Secret</span>
                        </div>
                        <div className="mt-1">
                            <SecretInput
                                copy={true}
                                id="client_secret"
                                name="client_secret"
                                autoComplete="one-time-code"
                                placeholder="Find the Client Secret on the developer portal of the external API provider."
                                defaultValue={integration ? integration.client_secret : ''}
                                required
                            />
                        </div>
                    </div>
                    {integration?.auth_mode !== AuthModes.Custom && (
                        <div className="flex flex-col">
                            <div className="flex items-center mb-1">
                                <span className="text-gray-400 text-xs">Scopes</span>
                            </div>
                            <div className="mt-1">
                                <TagsInput id="scopes" name="scopes" type="text" defaultValue={integration ? integration?.scopes : ''} minLength={1} />
                            </div>
                        </div>
                    )}
                </>
            )}
            <div className="pb-4">
                <div className="flex justify-between">
                    {(!integration || (integration?.auth_mode !== AuthModes.Basic && integration?.auth_mode !== AuthModes.ApiKey)) && (
                        <button type="submit" className="bg-white mt-4 h-8 rounded-md hover:bg-gray-300 border px-3 pt-0.5 text-sm text-black">
                            Save
                        </button>
                    )}
                    {integration && (
                        <button
                            type="button"
                            className="mt-4 flex h-8 rounded-md bg-pink-600 bg-opacity-20 border border-pink-600 pl-3 pr-3 pt-1.5 text-sm text-pink-600"
                            onClick={deleteButtonClicked}
                        >
                            <p>Delete</p>
                        </button>
                    )}
                </div>
                {serverErrorMessage && <p className="mt-6 text-sm text-red-600">{serverErrorMessage}</p>}
            </div>
        </form>
    );
}
