import { ReactNode } from 'react';

interface PageProps {
    title: string;
    buttons: ({
        title: string;
        action: () => void;
    } | {
        icon: string;
        action: () => void;
    })[];
    settingsAction?: () => void;
    children: ReactNode;
}

function Page(props: PageProps): JSX.Element {
    return (
        <div className="d-flex flex-column align-items-center text-center position-relative">
            <h1>{props.title}</h1>

            { props.children }

            <div>
                { props.buttons.map((button) => (
                    'title' in button ?
                        <button onClick={button.action} className="btn btn-primary mt-3">{button.title}</button> : 
                        <button onClick={button.action} className="btn btn-primary rounded-circle mt-3"><i className={`fa fa-${button.icon}`}></i></button>
                )) }
            </div>

            {
                props.settingsAction ?
                    <button onClick={props.settingsAction} className="btn shadow-none p-2 position-absolute" style={{ opacity: 0.3, bottom: -2, right: 0, color: 'white' }}><i className="fa fa-gears"></i></button> :
                    <></>
            }
        </div>
    );
}

export default Page;