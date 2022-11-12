import { Box, Button, Center, Flex, Heading, Input } from '@chakra-ui/react'
import React, { useEffect } from 'react'
import { signInWithGoogle, auth } from '../firebase/firebase'
import { useAuthState, useSignInWithGithub, useSignInWithGoogle } from 'react-firebase-hooks/auth';
import LoadingOverlay from '../components/LoadingOverlay';
import { useRouter} from 'next/router';


function LoginPage() {

    const [user, loading] = useAuthState(auth);
    const handleSignup = async () => {
        const user = await signInWithGoogle()
        console.log(user)
    }

    const router = useRouter() 
    useEffect(() => {
        if(user){
            router.push('/edit-user-profile')
        }
    })

    return (
        <>
            <Box position={'relative'}>
                <Flex justify={'center'} align='center' bg={'brand.900'} w='100vw' h={'100vh'}>
                    <Box w={'95vw'} bg='white' h={'500px'} borderRadius={15} p={10}>
                        <Heading bgGradient='linear(to-l, #7928CA, #FF0080)'
                            bgClip='text'
                            fontSize='5xl'
                            fontWeight='extrabold'>Please Login</Heading>
                        <Center>
                            <Button onClick={handleSignup}> Sign up with Google </Button>
                        </Center>
                    </Box>
                    <Box>
                    </Box>
                </Flex>
                {loading &&
                    <LoadingOverlay />
                }
            </Box>
        </>
    )
}

export default LoginPage