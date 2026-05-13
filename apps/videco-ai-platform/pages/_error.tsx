import Error from "next/error";

const CustomErrorComponent = (props) => {
    return <Error statusCode={props.statusCode} />;
};

CustomErrorComponent.getInitialProps = async (contextData) => {
    // time to send the error before the lambda exits

    // This will contain the status code of the response
    return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
