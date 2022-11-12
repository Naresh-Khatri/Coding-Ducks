import { Box, Center, Spinner, Text } from "@chakra-ui/react"

function LoadingOverlay() {
    return (
        <Box
            position={'absolute'}
            zIndex='100'
            h={'100vh'}
            w='100vw'
            top={0}
            bottom={0}
            style={{ background: '#33333377' }}>
            <Center h={'100%'} flexDir='column' color={'white'}>
                <Spinner h={100} w={100} thickness={10} />
                <Text mt={5} fontSize={'xl'}>
                    Waiting...
                </Text>

            </Center>
        </Box>
    )
}

export default LoadingOverlay